/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable new-cap */
import { expect, use } from 'chai'
import { ethers, waffle, upgrades } from 'hardhat'
import { solidity, MockProvider } from 'ethereum-waffle'
import { attach } from './utils'
import {
	STokensBridgeV2,
	STokensCertificate,
	STokensSubstitute,
} from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract, Wallet } from 'ethers'
import { mockSTokensManagerV2ABI } from './mockABI'

use(solidity)

const { deployMockContract } = waffle

describe('STokensBridgeV2', () => {
	const init = async (): Promise<
		[STokensBridgeV2, STokensCertificate, Contract, SignerWithAddress, Wallet]
	> => {
		const [, user] = await ethers.getSigners()
		// Ceritificate
		const STokensCertificate = await ethers.getContractFactory(
			'STokensCertificate'
		)
		// Do not initialize because initialize will be implemented by BridgeV2 initialize()
		const sTokensCertificate = (await upgrades.deployProxy(STokensCertificate, {
			initializer: false,
		})) as STokensCertificate

		// STokens
		const sTokensManagerMock = await deployMockContract(
			user,
			mockSTokensManagerV2ABI
		)

		// BridgeV2
		const STokensBridgeV2 = await ethers.getContractFactory('STokensBridgeV2')
		// Here BridgeV2 is initialized (and Cert too)
		const sTokensBridgeV2 = (await upgrades.deployProxy(STokensBridgeV2, [
			sTokensManagerMock.address,
			sTokensCertificate.address,
		])) as STokensBridgeV2

		const provider = new MockProvider()
		const property = provider.createEmptyWallet()
		const sTokenId = 1
		const positions = {
			property: property.address,
			amount: 10,
			price: 1,
			cumulativeReward: 1,
			pendingReward: 1,
		}
		// User can transfer sTokensId=1 to Bridge
		await sTokensManagerMock.mock.positions
			.withArgs(sTokenId)
			.returns(positions)
		await sTokensManagerMock.mock.transferFrom
			.withArgs(user.address, sTokensBridgeV2.address, sTokenId)
			.returns()
		// User can get back sTokensId=1 from Bridge
		await sTokensManagerMock.mock.transferFrom
			.withArgs(sTokensBridgeV2.address, user.address, sTokenId)
			.returns()
		return [
			sTokensBridgeV2,
			sTokensCertificate,
			sTokensManagerMock,
			user,
			property,
		]
	}

	describe('initialize', () => {
		it('The initialize function can only be executed once.', async () => {
			const [sTokensBridgeV2, sTokensCertificateProxy, sTokensManagerMock] =
				await init()
			await expect(
				sTokensBridgeV2.initialize(
					sTokensManagerMock.address,
					sTokensCertificateProxy.address
				)
			).to.be.revertedWith('Initializable: contract is already initialized')
		})
	})

	describe('name', () => {
		it('get token name', async () => {
			const [, sTokensCertificateProxy] = await init()
			const name = await sTokensCertificateProxy.name()
			expect(name).to.equal('sTokens Certificate V1')
		})
	})
	describe('symbol', () => {
		it('get token symbol', async () => {
			const [, sTokensCertificateProxy] = await init()
			const symbol = await sTokensCertificateProxy.symbol()
			expect(symbol).to.equal('STOKENS-CERTIFICATE-V1')
		})
	})

	describe('depositSToken', () => {
		describe('success', () => {
			it('deposit SToken', async () => {
				const [sTokensBridgeV2, sTokensCertificateProxy, , user, property] =
					await init()
				await sTokensBridgeV2
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				// Check Deposit event
				const filter = sTokensBridgeV2.filters.Deposit()
				const events = await sTokensBridgeV2.queryFilter(filter)
				const from = events[0].args._from
				const eventsSTokenId = events[0].args._sTokenId
				const certificateId = events[0].args._certificateId
				expect(from).to.equal(user.address)
				expect(eventsSTokenId).to.equal(1)
				expect(certificateId).to.equal(1)
				// Check user got Cert721
				const certOwner = await sTokensCertificateProxy.ownerOf(certificateId)
				expect(certOwner).to.equal(user.address)
				// Check user got Cert20
				const sTokensSubstituteAddress =
					await sTokensBridgeV2.sTokensSubstituteAddress(property.address)
				const sTokensSubstitute = (await attach(
					'STokensSubstitute',
					sTokensSubstituteAddress
				)) as STokensSubstitute
				// Check amount
				const amount = await sTokensSubstitute.balanceOf(user.address)
				expect(amount).to.equal(10)
			})
		})
		describe('fail', () => {
			it('other user cannot deposit', async () => {
				const [sTokensBridgeV2, , sTokensManagerMock] = await init()
				const [owner] = await ethers.getSigners()
				await sTokensManagerMock.mock.transferFrom
					.withArgs(owner.address, sTokensBridgeV2.address, 1)
					.revertsWithReason('ERC721: transfer of token that is not own')
				await expect(
					sTokensBridgeV2.depositSToken(1, { gasLimit: 1200000 })
				).to.be.revertedWith('ERC721: transfer of token that is not own')
			})
		})
	})

	describe('redeemSToken', () => {
		describe('success', () => {
			it('redeem SToken', async () => {
				const [sTokensBridgeV2, sTokensCertificateProxy, , user, property] =
					await init()

				await sTokensBridgeV2
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				const sTokensSubstituteAddress =
					await sTokensBridgeV2.sTokensSubstituteAddress(property.address)
				const sTokensSubstitute = (await attach(
					'STokensSubstitute',
					sTokensSubstituteAddress
				)) as STokensSubstitute
				await sTokensBridgeV2
					.connect(user)
					.redeemSToken(1, { gasLimit: 1200000 })
				// Check Redeem event
				const filter = sTokensBridgeV2.filters.Redeem()
				const events = await sTokensBridgeV2.queryFilter(filter)
				const from = events[0].args._from
				const eventsSTokenId = events[0].args._sTokenId
				const certificateId = events[0].args._certificateId
				expect(from).to.equal(user.address)
				expect(eventsSTokenId).to.equal(1)
				expect(certificateId).to.equal(1)
				// Check Cert721 was burned
				await expect(sTokensCertificateProxy.ownerOf(1)).to.be.revertedWith(
					'ERC721: owner query for nonexistent token'
				)
				// Check Cert20 was burned
				const amount = await sTokensSubstitute.balanceOf(user.address)
				expect(amount).to.equal(0)
			})
			it('redeem SToken then deposit and redeem again', async () => {
				const [sTokensBridgeV2, sTokensCertificateProxy, , user] = await init()
				await sTokensBridgeV2
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				await sTokensBridgeV2
					.connect(user)
					.redeemSToken(1, { gasLimit: 1200000 })
				await sTokensBridgeV2
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				// Check certId of 2nd Deposit is correct
				const filter = sTokensBridgeV2.filters.Deposit()
				const events = await sTokensBridgeV2.queryFilter(filter)
				const certificateId = events[1].args._certificateId
				expect(certificateId).to.equal(2)
				const certOwner = await sTokensCertificateProxy.ownerOf(certificateId)
				expect(certOwner).to.equal(user.address)
				// Check certId=2 is correctly burned
				await sTokensBridgeV2
					.connect(user)
					.redeemSToken(1, { gasLimit: 1200000 })
				await expect(sTokensCertificateProxy.ownerOf(2)).to.be.revertedWith(
					'ERC721: owner query for nonexistent token'
				)
			})
		})

		describe('fail', () => {
			it('other user cannot redeem', async () => {
				const [sTokensBridgeV2, , , user] = await init()
				await sTokensBridgeV2
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				await expect(
					sTokensBridgeV2.redeemSToken(1, { gasLimit: 1200000 })
				).to.be.revertedWith('You do not have Certificate')
			})
			it('when user does not have sufficient Cert20 tokens', async () => {
				const [sTokensBridgeV2, , , user, property] = await init()
				const [owner] = await ethers.getSigners()
				await sTokensBridgeV2
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				const sTokensSubstituteAddress =
					await sTokensBridgeV2.sTokensSubstituteAddress(property.address)
				const sTokensSubstitute = (await attach(
					'STokensSubstitute',
					sTokensSubstituteAddress
				)) as STokensSubstitute
				await sTokensSubstitute.connect(user).transfer(owner.address, 1)
				await expect(
					sTokensBridgeV2.connect(user).redeemSToken(1, { gasLimit: 1200000 })
				).to.be.revertedWith('ERC20: burn amount exceeds balance')
			})
		})
	})
})
