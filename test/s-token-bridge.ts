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
		const sTokensCertificate721Address = await sTokensBridge.sTokensCertificate721Address()
		const sTokensCertificate721 = await attach('STokensCertificate721', sTokensCertificate721Address)
		return [sTokensManager, sTokensBridge, sTokensCertificate721, user, mintParam, tokenId]
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
			const [, , sTokensCertificate721] = await init()
			const name = await sTokensCertificate721.name()
			expect(name).to.equal('Dev Protocol sTokens certificate')
		})
	})
	describe('symbol', () => {
		it('get token symbol', async () => {
			const [, , sTokensCertificate721] = await init()
			const symbol = await sTokensCertificate721.symbol()
			expect(symbol).to.equal('DEV-STOKENS-CERT')
		})
	})

	describe('depositSToken', () => {
		describe('success', () => {
			it('deposit SToken', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate721, user, mintParam, tokenId] = await init()
				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				// check SToken was transfered to Bridge
				let sTokenOwner = await sTokensManager.ownerOf(tokenId)
				expect(sTokenOwner).to.equal(sTokensBridge.address)
				// check user got Cert721 
				let certOwner = await sTokensCertificate721.ownerOf(tokenId)
				expect(certOwner).to.equal(user.address)// 
				// check user got Cert20 
				const sTokensCertificate20Address = await sTokensBridge.sTokensCertificate20Address(mintParam.property)
				const sTokensCertificate20 = await attach('STokensCertificate20', sTokensCertificate20Address)
				let amount = await sTokensCertificate20.balanceOf(user.address)
				expect(amount).to.equal(mintParam.amount)
			})
		})
		describe('fail', () => {
			it('other user cannot deposit', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate721, user, mintParam, tokenId] = await init()
				await expect(sTokensBridge.depositSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC721: transfer of token that is not own')
			})
			it('when user does not have SToken', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate721, user, mintParam, tokenId] = await init()
				const [owner,] = await ethers.getSigners()
				await sTokensManager.connect(user).transferFrom(user.address, owner.address, tokenId, { gasLimit: 1200000 })
				await expect(sTokensBridge.depositSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
			})
		})
	})

	describe('redeemSToken', () => {
		describe('success', () => {
			it('redeem SToken', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate721, user, mintParam, tokenId] = await init()

				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				const sTokensCertificate20Address = await sTokensBridge.sTokensCertificate20Address(mintParam.property)
				const sTokensCertificate20 = await attach('STokensCertificate20', sTokensCertificate20Address)
				await sTokensBridge.connect(user).redeemSToken(tokenId, { gasLimit: 1200000 })
				// check user got SToken 
				let sTokenOwner = await sTokensManager.ownerOf(tokenId)
				expect(sTokenOwner).to.equal(user.address)
				// check Cert721 was burned
				await expect(sTokensCertificate721.ownerOf(tokenId)).to.be.revertedWith('ERC721: owner query for nonexistent token')
				// check Cert20 was burned
				let amount = await sTokensCertificate20.balanceOf(user.address)
				expect(amount).to.equal(0)
			})
		})

		describe('fail', () => {
			it('other user cannot redeem', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate721, user, mintParam, tokenId] = await init()
				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				await expect(sTokensBridge.redeemSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('You do not have Cert721 token')
			})
			it('when user does not have sufficient Cert20 tokens', async () => {
				const [sTokensManager, sTokensBridge, sTokensCertificate721, user, mintParam, tokenId] = await init()
				const [owner,] = await ethers.getSigners()
				await sTokensBridge.connect(user).depositSToken(tokenId, { gasLimit: 2400000 })
				const sTokensCertificate20Address = await sTokensBridge.sTokensCertificate20Address(mintParam.property)
				const sTokensCertificate20 = await attach('STokensCertificate20', sTokensCertificate20Address)
				await sTokensCertificate20.connect(user).transfer(owner.address, 1)
				await expect(sTokensBridge.connect(user).redeemSToken(tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC20: burn amount exceeds balance')
			})
		})
	})
})