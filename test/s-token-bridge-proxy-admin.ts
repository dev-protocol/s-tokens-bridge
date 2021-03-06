import { expect, use } from 'chai'
import { ethers, waffle } from 'hardhat'
import { constants } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deploy, deployWith3Arg } from './utils'
import {
	STokensBridge,
	STokensBridgeProxy,
	STokensBridgeProxyAdmin,
	STokensCertificate,
	ProxyAdmin,
} from '../typechain'
import { mockSTokensManagerABI } from './mockABI'

use(solidity)

const { deployMockContract } = waffle

describe('STokensBridgeProxyAdmin', () => {
	const init = async (): Promise<
		[STokensBridgeProxy, STokensBridge, ProxyAdmin]
	> => {
		const [, user] = await ethers.getSigners()
		const sTokensManagerMock = await deployMockContract(
			user,
			mockSTokensManagerABI
		)
		const sTokensCertificate = (await deploy(
			'STokensCertificate'
		)) as STokensCertificate
		const data = ethers.utils.arrayify('0x')
		const proxyAdmin = (await deploy('ProxyAdmin')) as ProxyAdmin
		let proxy = (await deployWith3Arg(
			'STokensBridgeProxy',
			sTokensCertificate.address,
			proxyAdmin.address,
			data
		)) as STokensBridgeProxy
		const sTokensCertificateFactory = await ethers.getContractFactory(
			'STokensCertificate'
		)
		const sTokensCertificateProxy = sTokensCertificateFactory.attach(
			proxy.address
		)

		const sTokensBridge = (await deploy('STokensBridge')) as STokensBridge
		proxy = (await deployWith3Arg(
			'STokensBridgeProxy',
			sTokensBridge.address,
			proxyAdmin.address,
			data
		)) as STokensBridgeProxy
		const sTokensBridgeFactory = await ethers.getContractFactory(
			'STokensBridge'
		)
		const proxyDelegate = sTokensBridgeFactory.attach(proxy.address)
		await proxyDelegate.initialize(
			sTokensManagerMock.address,
			sTokensCertificateProxy.address
		)

		return [proxy, sTokensBridge, proxyAdmin]
	}

	describe('getProxyImplementation', () => {
		describe('success', () => {
			it('get implementation address', async () => {
				const [proxy, sTokensBridge, proxyAdmin] = await init()
				const implementation = await proxyAdmin.getProxyImplementation(
					proxy.address
				)
				expect(implementation).to.equal(sTokensBridge.address)
			})
			it('change implementation address', async () => {
				const [proxy, sTokensBridge, proxyAdmin] = await init()
				const implementation = await proxyAdmin.getProxyImplementation(
					proxy.address
				)
				expect(implementation).to.equal(sTokensBridge.address)
				const sTokensBridgeSecound = (await deploy(
					'STokensBridge'
				)) as STokensBridge
				await proxyAdmin.upgrade(proxy.address, sTokensBridgeSecound.address)
				const implementationSecound = await proxyAdmin.getProxyImplementation(
					proxy.address
				)
				expect(implementationSecound).to.equal(sTokensBridgeSecound.address)
			})
		})
		describe('fail', () => {
			it('get implementation address', async () => {
				const [proxy, , proxyAdmin] = await init()
				const [, user] = await ethers.getSigners()
				const proxyAdminUser = proxyAdmin.connect(user)
				await expect(
					proxyAdminUser.upgrade(proxy.address, constants.AddressZero)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
	describe('getProxyAdmin', () => {
		describe('success', () => {
			it('get admin address', async () => {
				const [proxy, , proxyAdmin] = await init()
				const implementation = await proxyAdmin.getProxyAdmin(proxy.address)
				expect(implementation).to.equal(proxyAdmin.address)
			})
			it('change admin address', async () => {
				const [proxy, , proxyAdmin] = await init()
				const adminAddress = await proxyAdmin.getProxyAdmin(proxy.address)
				expect(adminAddress).to.equal(proxyAdmin.address)
				const proxyAdminSecond = (await deploy(
					'STokensBridgeProxyAdmin'
				)) as STokensBridgeProxyAdmin
				await proxyAdmin.changeProxyAdmin(
					proxy.address,
					proxyAdminSecond.address
				)
				const adminAddressSecond = await proxyAdminSecond.getProxyAdmin(
					proxy.address
				)
				expect(adminAddressSecond).to.equal(proxyAdminSecond.address)
			})
		})
		describe('fail', () => {
			it('get admin address', async () => {
				const [proxy, , proxyAdmin] = await init()
				const [, user] = await ethers.getSigners()
				const proxyAdminUser = proxyAdmin.connect(user)
				await expect(
					proxyAdminUser.changeProxyAdmin(proxy.address, constants.AddressZero)
				).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
})
