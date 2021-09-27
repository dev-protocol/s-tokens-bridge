/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { solidity } from 'ethereum-waffle'
import {
	deploy,
	deployWithArg,
	deployWith3Arg,
	createMintParams,
} from './utils'
import { checkTokenUri } from './token-uri-test'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

use(solidity)

describe('STokensBridgeProxy', () => {
	const init = async (): Promise<
		[Contract, Contract, Contract, Contract, SignerWithAddress, any, any]
	> => {
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
		const sTokenId = events[0].args!.tokenId.toString()

		const sTokensCertificate = await deploy('STokensCertificate')
		const data = ethers.utils.arrayify('0x')
		const proxyAdmin = await deploy('ProxyAdmin')
		let proxy = await deployWith3Arg(
			'TransparentUpgradeableProxy',
			sTokensCertificate.address,
			proxyAdmin.address,
			data
		)
		const sTokensCertificateFactory = await ethers.getContractFactory(
			'STokensCertificate'
		)
		const sTokensCertificateProxy = sTokensCertificateFactory.attach(proxy.address)

		const sTokensBridge = await deploy('STokensBridge')
		proxy = await deployWith3Arg(
			'TransparentUpgradeableProxy',
			sTokensBridge.address,
			proxyAdmin.address,
			data
		)
		const sTokensBridgeFactory = await ethers.getContractFactory(
			'STokensBridge'
		)
		const proxyDelegate = sTokensBridgeFactory.attach(proxy.address)
		await proxyDelegate.initialize(sTokensManager.address, sTokensCertificateProxy.address)
		await sTokensManager.connect(user).setApprovalForAll(proxyDelegate.address, true, { gasLimit: 1200000 })

		return [
			proxy,
			proxyDelegate,
			sTokensBridge,
			proxyAdmin,
            user,
            mintParam,
            sTokenId,
		]
	}

	describe('upgradeTo', () => {
		describe('success', () => {
			it('upgrade logic contract', async () => {
				const [proxy, proxyDelegate, , proxyAdmin, user, mintParam, sTokenId] = await init()
				await proxyDelegate.connect(user).depositSToken(sTokenId, { gasLimit: 2400000 })
				let certificateId = await proxyDelegate.sTokensCertificateId(user.address, sTokenId)
				expect(certificateId).to.equal(1)
				const sTokensBridgeSecond = await deploy('STokensBridgeTest')
				await proxyAdmin.upgrade(proxy.address, sTokensBridgeSecond.address)
				const sTokensBridgeTestFactory = await ethers.getContractFactory(
					'STokensBridgeTest'
				)
				const proxyDelegateTest = sTokensBridgeTestFactory.attach(
					proxy.address
				)
				const sTokensCertificateIdSecond = await proxyDelegateTest.dummyFunc()
				expect(sTokensCertificateIdSecond).to.equal(1)
			})

			it('The data is stored in the proxy(STokensBridge)', async () => {
				const [proxy, proxyDelegate, , proxyAdmin] = await init()
				const sTokensAddress = await proxyDelegate.sTokensAddress()
				const sTokensCertificateAddress = await proxyDelegate.sTokensCertificateAddress()
				const sTokensBridgeSecond = await deploy('STokensBridge')
				await proxyAdmin.upgrade(proxy.address, sTokensBridgeSecond.address)
				const sTokensAddressSecond = await proxyDelegate.sTokensAddress()
				const sTokensCertificateAddressSecond = await proxyDelegate.sTokensCertificateAddress()
				expect(sTokensAddressSecond).to.equal(sTokensAddress)
				expect(sTokensCertificateAddressSecond).to.equal(sTokensCertificateAddress)
			})

			it('The data is stored in the proxy(ERC721Upgradeable)', async () => {
				const [proxy, proxyDelegate, , proxyAdmin, user, mintParam, sTokenId] = await init()
				await proxyDelegate.connect(user).depositSToken(sTokenId, { gasLimit: 2400000 })
				const sTokensCertificateIdFirst = await proxyDelegate.sTokensCertificateId(user.address, sTokenId)
				const sTokensSubstituteAddressFirst = await proxyDelegate.sTokensSubstituteAddress(mintParam.property)
				const sTokensBridgeSecond = await deploy('STokensBridge')
				await proxyAdmin.upgrade(proxy.address, sTokensBridgeSecond.address)
				const sTokensCertificateIdSecond = await proxyDelegate.sTokensCertificateId(user.address, sTokenId)
				const sTokensSubstituteAddressSecond = await proxyDelegate.sTokensSubstituteAddress(mintParam.property)
				expect(sTokensCertificateIdFirst).to.equal(sTokensCertificateIdSecond)
				expect(sTokensSubstituteAddressFirst).to.equal(sTokensSubstituteAddressSecond)
			})
		})
	})
})
