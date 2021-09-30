/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ethers } from 'hardhat'
import { STokensBridge } from '../typechain/STokensBridge'
import { STokensBridgeL2 } from '../typechain/STokensBridgeL2'
import { STokensCertificate } from '../typechain/STokensCertificate'
import { STokensBridgeProxyAdmin } from '../typechain/STokensBridgeProxyAdmin'
import { STokensBridgeProxy } from '../typechain/STokensBridgeProxy'

async function main() {
	//!please check!!!!!!!!!
	const sTokensManagerAddress = '0xD6D07f1c048bDF2B3d5d9B6c25eD1FC5348D0A70'
	const sTokensManagerL2Address = '0xD6D07f1c048bDF2B3d5d9B6c25eD1FC5348D0A70'
	//!!!!!!!!!!!!!!!!!!!!!!

	// STokensCertificate
	const sTokensCertificateFactory = await ethers.getContractFactory(
		'STokensCertificate'
	)
	const sTokensCertificate = await sTokensCertificateFactory.deploy() as STokensCertificate
	await sTokensCertificate.deployed()

	const sTokensCertificateL2 = await sTokensCertificateFactory.deploy() as STokensCertificate
	await sTokensCertificateL2.deployed()

	// sTokensBridge
	const sTokensBridgeFactory = await ethers.getContractFactory(
		'STokensBridge'
	)

	const sTokensBridge = await sTokensBridgeFactory.deploy() as STokensBridge
	await sTokensBridge.deployed()

	// sTokensBridgeL2
	const sTokensBridgeL2Factory = await ethers.getContractFactory(
		'STokensBridgeL2'
	)

	const sTokensBridgeL2 = await sTokensBridgeL2Factory.deploy() as STokensBridgeL2
	await sTokensBridgeL2.deployed()

	// STokensBridgeProxyAdmin
	const sTokensBridgeProxyAdminFactory = await ethers.getContractFactory(
		'STokensBridgeProxyAdmin'
	)
	const sTokensBridgeProxyAdmin =
		await sTokensBridgeProxyAdminFactory.deploy() as STokensBridgeProxyAdmin
	await sTokensBridgeProxyAdmin.deployed()

	// STokensBridgeProxy
	const sTokensBridgeProxyFactory = await ethers.getContractFactory(
		'STokensBridgeProxy'
	)

	// sTokensCertificateProxy
	const data = ethers.utils.arrayify('0x')

	const sTokensCertificateProxy = await sTokensBridgeProxyFactory.deploy(
		sTokensCertificate.address,
		sTokensBridgeProxyAdmin.address,
		data
	) as STokensBridgeProxy
	await sTokensCertificateProxy.deployed()

	const sTokensCertificateL2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensCertificateL2.address,
		sTokensBridgeProxyAdmin.address,
		data
	) as STokensBridgeProxy
	await sTokensCertificateL2Proxy.deployed()

	// sTokensBridgeProxy
	const sTokensBridgeProxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridge.address,
		sTokensBridgeProxyAdmin.address,
		data
	) as STokensBridgeProxy
	await sTokensBridgeProxy.deployed()

	const proxy = sTokensBridgeFactory.attach(sTokensBridgeProxy.address) as STokensBridge
	await proxy.initialize(
		sTokensManagerAddress,
		sTokensCertificateProxy.address
	)

	// sTokensBridgeL2Proxy
	const sTokensBridgeL2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridgeL2.address,
		sTokensBridgeProxyAdmin.address,
		data
	) as STokensBridgeProxy
	await sTokensBridgeProxy.deployed()

	const proxyL2 = sTokensBridgeL2Factory.attach(sTokensBridgeL2Proxy.address) as STokensBridgeL2
	await proxyL2.initialize(
		sTokensManagerL2Address,
		sTokensCertificateL2Proxy.address
	)

	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log('sTokensCertificateProxy deployed to:', sTokensCertificateProxy.address)
	console.log('sTokensCertificateL2 deployed to:', sTokensCertificateL2.address)
	console.log('sTokensCertificateL2Proxy deployed to:', sTokensCertificateL2Proxy.address)
	console.log('sTokensBridge deployed to:', sTokensBridge.address)
	console.log('sTokensBridgeProxy deployed to:', sTokensBridgeProxy.address)
	console.log('sTokensBridgeL2 deployed to:', sTokensBridgeL2.address)
	console.log('sTokensBridgeL2Proxy deployed to:', sTokensBridgeL2Proxy.address)
	console.log(
		'sTokensBridgeProxyAdmin deployed to:',
		sTokensBridgeProxyAdmin.address
	)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})