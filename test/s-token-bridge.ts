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
	const init = async (): Promise<[Contract, Contract, Contract, Contract, SignerWithAddress]> => {
		const [, user] = await ethers.getSigners()
		const addressConfig = await deploy('AddressConfigTest')
		const sTokensManager = await deploy('STokensManagerTest')
		await sTokensManager.initialize(addressConfig.address)
		const lockup = await deployWithArg('LockupTest', sTokensManager.address)
		await addressConfig.setLockup(lockup.address)
		const sTokensManagerUser = sTokensManager.connect(user)
		// const sTokensBridge = await deployWith2Arg('BridgeToken', 'a', 'b')
		const sTokensBridge = await deploy('STokensBridge')
		await sTokensBridge.initialize()
		return [sTokensManager, sTokensManagerUser, lockup, sTokensBridge, user]
	}

	// describe('initialize', () => {
	// 	it('The initialize function can only be executed once.', async () => {
	// 		const [, , , sTokensBridge] = await init()
	// 		await expect(
	// 			sTokensBridge.initialize()
	// 		).to.be.revertedWith('Initializable: contract is already initialized')
	// 	})
	// })

	// describe('name', () => {
	// 	it('get token name', async () => {
	// 		const [, , , sTokensBridge] = await init()
	// 		const name = await sTokensBridge.name()
	// 		expect(name).to.equal('Dev Protocol sTokens certification')
	// 	})
	// })
	// describe('symbol', () => {
	// 	it('get token symbol', async () => {
	// 		const [, , , sTokensBridge] = await init()
	// 		const symbol = await sTokensBridge.symbol()
	// 		expect(symbol).to.equal('DEV-STOKENS-CERT')
	// 	})
	// })

	// describe('depositSToken', () => {
	// 	describe('success', () => {
	// 		it('transfers SToken to bridge', async () => {
	// 			const [sTokensManager, , lockup, sTokensBridge, user] = await init()
	// 			const mintParam = createMintParams()
	// 			await lockup.executeMint(
	// 				user.address, // user mints SToken
	// 				mintParam.property,
	// 				mintParam.amount,
	// 				mintParam.price,
	// 				{
	// 					gasLimit: 1200000,
	// 				}
	// 			)
	// 			const filter = sTokensManager.filters.Transfer()
	// 			const events = await sTokensManager.queryFilter(filter)
	// 			const tokenId = events[0].args!.tokenId.toString()
	// 			// check sToken belongs to user
	// 			let sTokenOwner = await sTokensManager.ownerOf(tokenId)
	// 			expect(sTokenOwner).to.equal(user.address)
	// 			await sTokensManager.connect(user).setApprovalForAll(sTokensBridge.address, true, { gasLimit: 1200000 })
	// 			// other user cannot deposit
	// 			await expect(sTokensBridge.depositSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC721: transfer of token that is not own')
	// 			// user can deposit
	// 			await sTokensBridge.connect(user).depositSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })
	// 			sTokenOwner = await sTokensManager.ownerOf(tokenId)
	// 			expect(sTokenOwner).to.equal(sTokensBridge.address)
	// 			// fail if user deposit again
	// 			await expect(sTokensBridge.connect(user).depositSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC721: transfer of token that is not own')
	// 			// check cert NFT belongs to user
	// 			let certOwner = await sTokensBridge.ownerOf(tokenId)
	// 			expect(certOwner).to.equal(user.address)
	// 			// other user cannot redeem
	// 			await expect(sTokensBridge.redeemSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })).to.be.revertedWith('You do not have cert token')
	// 			// redeem sToken
	// 			await sTokensBridge.connect(user).redeemSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })
	// 			sTokenOwner = await sTokensManager.ownerOf(tokenId)
	// 			expect(sTokenOwner).to.equal(user.address)
	// 			await expect(sTokensBridge.ownerOf(tokenId)).to.be.revertedWith('ERC721: owner query for nonexistent token')
	// 			// fail if user redeem again
	// 			await expect(sTokensBridge.connect(user).redeemSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })).to.be.revertedWith('ERC721: owner query for nonexistent token')
	// 			// user can deposit after redeem
	// 			await sTokensBridge.connect(user).depositSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })
	// 		})
	// 	})
	// })

	describe('depositSToken', () => {
		describe('success', () => {
			it('transfers SToken to bridge', async () => {
				const [sTokensManager, , lockup, sTokensBridge, user] = await init()
				const mintParam = createMintParams()
				await lockup.executeMint(
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

				await sTokensManager.connect(user).setApprovalForAll(sTokensBridge.address, true, { gasLimit: 1200000 })
				await sTokensBridge.connect(user).depositSToken(sTokensManager.address, tokenId, { gasLimit: 1200000 })
				const bridgeTokenAddr = await sTokensBridge.tokenAddress(mintParam.property)
				const bridgeToken = await attach('BridgeToken', bridgeTokenAddr)
				const amount = await bridgeToken.balanceOf(user.address)
				expect(amount).to.equal(mintParam.amount)
			})
		})
	})
})
