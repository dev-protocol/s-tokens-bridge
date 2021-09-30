/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable new-cap */
import { expect, use } from 'chai'
import { ethers, waffle } from 'hardhat'
import { solidity, MockProvider } from 'ethereum-waffle'
import { deploy, deployWith3Arg, attach } from './utils'
import { STokensBridge } from '../typechain/STokensBridge'
import { STokensCertificate } from '../typechain/STokensCertificate'
import { STokensSubstitute } from '../typechain/STokensSubstitute'
import { ProxyAdmin } from '../typechain/ProxyAdmin'
import { TransparentUpgradeableProxy } from '../typechain/TransparentUpgradeableProxy'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract, Wallet } from 'ethers'
import { mockSTokensManagerABI } from './mockABI'

use(solidity)

const { deployMockContract } = waffle

describe('STokensBridge', () => {
	const init = async (): Promise<
		[STokensBridge, STokensCertificate, Contract, SignerWithAddress, Wallet]
	> => {
		const [, user] = await ethers.getSigners()
		const sTokensCertificate = (await deploy(
			'STokensCertificate'
		)) as STokensCertificate
		const data = ethers.utils.arrayify('0x')
		const proxyAdmin = (await deploy('ProxyAdmin')) as ProxyAdmin
		const proxy = (await deployWith3Arg(
			'TransparentUpgradeableProxy',
			sTokensCertificate.address,
			proxyAdmin.address,
			data
		)) as TransparentUpgradeableProxy
		const sTokensCertificateFactory = await ethers.getContractFactory(
			'STokensCertificate'
		)
		const sTokensCertificateProxy = sTokensCertificateFactory.attach(
			proxy.address
		)!
		const sTokensBridge = (await deploy('STokensBridge')) as STokensBridge
		const sTokensManagerMock = await deployMockContract(
			user,
			mockSTokensManagerABI
		)
		const provider = new MockProvider()
		const property = provider.createEmptyWallet()
		const sTokenId = 1
		// User can transfer sTokensId=1 to Bridge
		await sTokensManagerMock.mock.positions
			.withArgs(sTokenId)
			.returns(property.address, 10, 1, 1, 1)
		await sTokensManagerMock.mock.transferFrom
			.withArgs(user.address, sTokensBridge.address, sTokenId)
			.returns()
		// User can get back sTokensId=1 from Bridge
		await sTokensManagerMock.mock.transferFrom
			.withArgs(sTokensBridge.address, user.address, sTokenId)
			.returns()
		await sTokensBridge.initialize(
			sTokensManagerMock.address,
			sTokensCertificateProxy.address
		)
		return [
			sTokensBridge,
			sTokensCertificateProxy,
			sTokensManagerMock,
			user,
			property,
		]
	}

	describe('initialize', () => {
		it('The initialize function can only be executed once.', async () => {
			const [sTokensBridge, sTokensCertificateProxy, sTokensManagerMock] =
				await init()
			await expect(
				sTokensBridge.initialize(
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
				const [sTokensBridge, sTokensCertificateProxy, , user, property] =
					await init()
				await sTokensBridge
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				// Check Deposit event
				const filter = sTokensBridge.filters.Deposit()
				const events = await sTokensBridge.queryFilter(filter)
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
					await sTokensBridge.sTokensSubstituteAddress(property.address)
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
				const [sTokensBridge, , sTokensManagerMock] = await init()
				const [owner] = await ethers.getSigners()
				await sTokensManagerMock.mock.transferFrom
					.withArgs(owner.address, sTokensBridge.address, 1)
					.revertsWithReason('ERC721: transfer of token that is not own')
				await expect(
					sTokensBridge.depositSToken(1, { gasLimit: 1200000 })
				).to.be.revertedWith('ERC721: transfer of token that is not own')
			})
		})
	})

	describe('redeemSToken', () => {
		describe('success', () => {
			it('redeem SToken', async () => {
				const [sTokensBridge, sTokensCertificateProxy, , user, property] =
					await init()

				await sTokensBridge
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				const sTokensSubstituteAddress =
					await sTokensBridge.sTokensSubstituteAddress(property.address)
				const sTokensSubstitute = (await attach(
					'STokensSubstitute',
					sTokensSubstituteAddress
				)) as STokensSubstitute
				await sTokensBridge.connect(user).redeemSToken(1, { gasLimit: 1200000 })
				// Check Redeem event
				const filter = sTokensBridge.filters.Redeem()
				const events = await sTokensBridge.queryFilter(filter)
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
				const [sTokensBridge, sTokensCertificateProxy, , user] = await init()
				await sTokensBridge
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				await sTokensBridge.connect(user).redeemSToken(1, { gasLimit: 1200000 })
				await sTokensBridge
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				// Check certId of 2nd Deposit is correct
				const filter = sTokensBridge.filters.Deposit()
				const events = await sTokensBridge.queryFilter(filter)
				const certificateId = events[1].args._certificateId
				expect(certificateId).to.equal(2)
				const certOwner = await sTokensCertificateProxy.ownerOf(certificateId)
				expect(certOwner).to.equal(user.address)
				// Check certId=2 is correctly burned
				await sTokensBridge.connect(user).redeemSToken(1, { gasLimit: 1200000 })
				await expect(sTokensCertificateProxy.ownerOf(1)).to.be.revertedWith(
					'ERC721: owner query for nonexistent token'
				)
			})
		})

		describe('fail', () => {
			it('other user cannot redeem', async () => {
				const [sTokensBridge, , , user] = await init()
				await sTokensBridge
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				await expect(
					sTokensBridge.redeemSToken(1, { gasLimit: 1200000 })
				).to.be.revertedWith('You do not have Certificate')
			})
			it('when user does not have sufficient Cert20 tokens', async () => {
				const [sTokensBridge, , , user, property] = await init()
				const [owner] = await ethers.getSigners()
				await sTokensBridge
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				const sTokensSubstituteAddress =
					await sTokensBridge.sTokensSubstituteAddress(property.address)
				const sTokensSubstitute = (await attach(
					'STokensSubstitute',
					sTokensSubstituteAddress
				)) as STokensSubstitute
				await sTokensSubstitute.connect(user).transfer(owner.address, 1)
				await expect(
					sTokensBridge.connect(user).redeemSToken(1, { gasLimit: 1200000 })
				).to.be.revertedWith('ERC20: burn amount exceeds balance')
			})
		})
	})
})
