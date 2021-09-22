import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { Contract, constants } from 'ethers'
import { solidity } from 'ethereum-waffle'
import { deploy, deployWithArg, deployWith3Arg } from './utils'

use(solidity)

describe('STokensBridgeProxyAdmin', () => {
	const init = async (): Promise<[Contract, Contract, Contract]> => {
		const sTokensBridge = await deploy('STokensBridge')
		const data = ethers.utils.arrayify('0x')
		const proxyAdmin = await deploy('STokensBridgeProxyAdmin')
		const proxy = await deployWith3Arg(
			'STokensBridgeProxy',
			sTokensBridge.address,
			proxyAdmin.address,
			data
		)
		const sTokensBridgeFactory = await ethers.getContractFactory(
			'STokensBridge'
		)
		// const proxyDelegate = sTokensBridgeFactory.attach(proxy.address)
		// await proxyDelegate.initialize(addressConfig.address)

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
				const sTokensBridgeSecound = await deploy('STokensBridge')
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
				const proxyAdminSecond = await deploy('STokensBridgeProxyAdmin')
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
