/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable new-cap */
import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { Contract, constants } from 'ethers'
import { solidity } from 'ethereum-waffle'
import {
	deploy,
	deployWithArg,
	deployWith2Arg,
	createMintParams,
	createUpdateParams,
	attach
} from './utils'
import { HARDHAT_ERROR } from './const'
import { checkTokenUri } from './token-uri-test'
import { STokensBridge } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

use(solidity)

describe('STokensManager', () => {
	const init = async (): Promise<[Contract, Contract, Contract, SignerWithAddress, any, number]> => {
		const [, user] = await ethers.getSigners()
		const sTokensManager = await deploy('STokensManagerTest')
		const mintParam = createMintParams()
		await sTokensManager.mint(
			user.address, // user mints SToken
			mintParam.property,
			mintParam.amount,
			mintParam.price,
			{
				gasLimit: 1200000,
			}
		)
		const filter = sTokensManager.filters.Transfer()
		const events = await sTokensManager.queryFilter(filter)
		const tokenId = events[0].args!.tokenId.toString()
		const sTokensBridge = await deploy('STokensBridge')
		await sTokensBridge.initialize(sTokensManager.address)
		await sTokensManager.connect(user).setApprovalForAll(sTokensBridge.address, true, { gasLimit: 1200000 })
		const sTokensCertificateAddress = await sTokensBridge.sTokensCertificateAddress()
		const sTokensCertificate = await attach('STokensCertificate', sTokensCertificateAddress)
		return [sTokensManager, sTokensBridge, sTokensCertificate, user, mintParam, tokenId]
	}

	describe('initialize', () => {
		it('The initialize function can only be executed once.', async () => {
			const [sTokensManager, sTokensBridge] = await init()
			await expect(
				sTokensBridge.initialize(sTokensManager.address)
			).to.be.revertedWith('Initializable: contract is already initialized')
		})
	})

	describe('name', () => {
		it('get token name', async () => {
			const [, , sTokensCertificate] = await init()
			const name = await sTokensCertificate.name()
			expect(name).to.equal('sTokens Certificate V1')
		})
	})
	describe('symbol', () => {
		it('get token symbol', async () => {
			const [, , sTokensCertificate] = await init()
			const symbol = await sTokensCertificate.symbol()
			expect(symbol).to.equal('STOKENS-CERTIFICATE-V1')
		})
	})

	describe('depositSToken', () => {
		describe('success', () => {
			it('deposit SToken', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate, user, mintParam, tokenId] = await init()
				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				// check SToken was transfered to Bridge
				let sTokenOwner = await sTokensManager.ownerOf(tokenId)
				expect(sTokenOwner).to.equal(sTokensBridge.address)
				// check user got Cert721 
				let certOwner = await sTokensCertificate.ownerOf(tokenId)
				expect(certOwner).to.equal(user.address)// 
				// check user got Cert20 
				const sTokensSubstituteAddress = await sTokensBridge.sTokensSubstituteAddress(mintParam.property)
				const sTokensSubstitute = await attach('STokensSubstitute', sTokensSubstituteAddress)
				// check name and symbol of SubstituteToken
				const name = await sTokensSubstitute.name()
				expect(name).to.equal('sTokens Substitute V1')
				const symbol = await sTokensSubstitute.symbol()
				expect(symbol).to.equal('STOKENS-SUBSTITUTE-V1')
				// check amount
				let amount = await sTokensSubstitute.balanceOf(user.address)
				expect(amount).to.equal(mintParam.amount)
			})
		})
		describe('fail', () => {
			it('other user cannot deposit', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate, user, mintParam, tokenId] = await init()
				await expect(sTokensBridge.depositSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC721: transfer of token that is not own')
			})
			it('when user does not have SToken', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate, user, mintParam, tokenId] = await init()
				const [owner,] = await ethers.getSigners()
				await sTokensManager.connect(user).transferFrom(user.address, owner.address, tokenId, { gasLimit: 1200000 })
				await expect(sTokensBridge.depositSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
			})
		})
	})

	describe('redeemSToken', () => {
		describe('success', () => {
			it('redeem SToken', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate, user, mintParam, tokenId] = await init()

				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				const sTokensSubstituteAddress = await sTokensBridge.sTokensSubstituteAddress(mintParam.property)
				const sTokensSubstitute = await attach('STokensSubstitute', sTokensSubstituteAddress)
				await sTokensBridge.connect(user).redeemSToken(tokenId, { gasLimit: 1200000 })
				// check user got SToken 
				let sTokenOwner = await sTokensManager.ownerOf(tokenId)
				expect(sTokenOwner).to.equal(user.address)
				// check Cert721 was burned
				await expect(sTokensCertificate.ownerOf(tokenId)).to.be.revertedWith('ERC721: owner query for nonexistent token')
				// check Cert20 was burned
				let amount = await sTokensSubstitute.balanceOf(user.address)
				expect(amount).to.equal(0)
			})
		})

		describe('fail', () => {
			it('other user cannot redeem', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate, user, mintParam, tokenId] = await init()
				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				await expect(sTokensBridge.redeemSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('You do not have Cert721 token')
			})
			it('when user does not have sufficient Cert20 tokens', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate, user, mintParam, tokenId] = await init()
				const [owner,] = await ethers.getSigners()
				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				const sTokensSubstituteAddress = await sTokensBridge.sTokensSubstituteAddress(mintParam.property)
				const sTokensSubstitute = await attach('STokensSubstitute', sTokensSubstituteAddress)
				await sTokensSubstitute.connect(user).transfer(owner.address, 1)
				await expect(sTokensBridge.connect(user).redeemSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC20: burn amount exceeds balance')
			})
		})
	})
})
