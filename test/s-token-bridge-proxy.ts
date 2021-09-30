/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable new-cap */
import { expect, use } from 'chai'
import { ethers, waffle } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { deploy, deployWith3Arg } from './utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { STokensBridge } from '../typechain/STokensBridge'
import { STokensBridgeTest } from '../typechain/STokensBridgeTest'
import { STokensCertificate } from '../typechain/STokensCertificate'
import { ProxyAdmin } from '../typechain/ProxyAdmin'
import { TransparentUpgradeableProxy } from '../typechain/TransparentUpgradeableProxy'
import { MockProvider } from 'ethereum-waffle'
import { Wallet } from 'ethers'
import { mockSTokensManagerABI } from './mockABI'

use(solidity)

const { deployMockContract } = waffle

describe('STokensBridgeProxy', () => {
	const init = async (): Promise<
		[
			TransparentUpgradeableProxy,
			STokensBridge,
			STokensBridge,
			ProxyAdmin,
			SignerWithAddress,
			Wallet,
		]
	> => {
		const [, user] = await ethers.getSigners()

		const sTokensCertificate = (await deploy(
			'STokensCertificate'
		)) as STokensCertificate
		const data = ethers.utils.arrayify('0x')
		const proxyAdmin = (await deploy('ProxyAdmin')) as ProxyAdmin
		let proxy = (await deployWith3Arg(
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
		)

		const sTokensBridge = (await deploy('STokensBridge')) as STokensBridge
		proxy = (await deployWith3Arg(
			'TransparentUpgradeableProxy',
			sTokensBridge.address,
			proxyAdmin.address,
			data
		)) as TransparentUpgradeableProxy
		const sTokensBridgeFactory = await ethers.getContractFactory(
			'STokensBridge'
		)
		const proxyDelegate = sTokensBridgeFactory.attach(proxy.address)
		const sTokensManagerMock = await deployMockContract(user, mockSTokensManagerABI)
		const provider = new MockProvider()
		const property = provider.createEmptyWallet()
		const sTokenId = 1
		// User can transfer sTokensId=1 to Bridge
		await sTokensManagerMock.mock.positions
			.withArgs(sTokenId)
			.returns(property.address, 10, 1, 1, 1)
		await sTokensManagerMock.mock.transferFrom
			.withArgs(user.address, proxyDelegate.address, sTokenId)
			.returns()
		// User can get back sTokensId=1 from Bridge
		await sTokensManagerMock.mock.transferFrom
			.withArgs(sTokensBridge.address, user.address, sTokenId)
			.returns()
		await proxyDelegate.initialize(
			sTokensManagerMock.address,
			sTokensCertificateProxy.address
		)

		return [
			proxy,
			proxyDelegate,
			sTokensBridge,
			proxyAdmin,
			user,
			property
		]
	}

	describe('upgradeTo', () => {
		describe('success', () => {
			it('upgrade logic contract', async () => {
				const [proxy, proxyDelegate, , proxyAdmin, user] =
					await init()
				await proxyDelegate
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				const certificateId = await proxyDelegate.sTokensCertificateId(
					user.address,
					1
				)
				expect(certificateId).to.equal(1)
				const sTokensBridgeSecond = (await deploy(
					'STokensBridgeTest'
				)) as STokensBridgeTest
				await proxyAdmin.upgrade(proxy.address, sTokensBridgeSecond.address)
				const sTokensBridgeTestFactory = await ethers.getContractFactory(
					'STokensBridgeTest'
				)
				const proxyDelegateTest = sTokensBridgeTestFactory.attach(proxy.address)
				const sTokensCertificateIdSecond = await proxyDelegateTest.dummyFunc()
				expect(sTokensCertificateIdSecond).to.equal(1)
			})

			it('The data is stored in the proxy(STokensBridge)', async () => {
				const [proxy, proxyDelegate, , proxyAdmin] = await init()
				const sTokensAddress = await proxyDelegate.sTokensAddress()
				const sTokensCertificateProxyAddress =
					await proxyDelegate.sTokensCertificateProxyAddress()
				const sTokensBridgeSecond = (await deploy(
					'STokensBridge'
				)) as STokensBridge
				await proxyAdmin.upgrade(proxy.address, sTokensBridgeSecond.address)
				const sTokensAddressSecond = await proxyDelegate.sTokensAddress()
				const sTokensCertificateProxyAddressSecond =
					await proxyDelegate.sTokensCertificateProxyAddress()
				expect(sTokensAddressSecond).to.equal(sTokensAddress)
				expect(sTokensCertificateProxyAddressSecond).to.equal(
					sTokensCertificateProxyAddress
				)
			})

			it('The data is stored in the proxy(ERC721Upgradeable)', async () => {
				const [proxy, proxyDelegate, , proxyAdmin, user, property] =
					await init()
				await proxyDelegate
					.connect(user)
					.depositSToken(1, { gasLimit: 2400000 })
				const sTokensCertificateIdFirst =
					await proxyDelegate.sTokensCertificateId(user.address, 1)
				const sTokensSubstituteAddressFirst =
					await proxyDelegate.sTokensSubstituteAddress(property.address)
				const sTokensBridgeSecond = (await deploy(
					'STokensBridge'
				)) as STokensBridge
				await proxyAdmin.upgrade(proxy.address, sTokensBridgeSecond.address)
				const sTokensCertificateIdSecond =
					await proxyDelegate.sTokensCertificateId(user.address, 1)
				const sTokensSubstituteAddressSecond =
					await proxyDelegate.sTokensSubstituteAddress(property.address)
				expect(sTokensCertificateIdFirst).to.equal(sTokensCertificateIdSecond)
				expect(sTokensSubstituteAddressFirst).to.equal(
					sTokensSubstituteAddressSecond
				)
			})
		})
	})
})
