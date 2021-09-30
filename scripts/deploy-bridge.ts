/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ethers } from 'hardhat'
import { STokensBridge } from '../typechain/STokensBridge'
import { STokensCertificate } from '../typechain/STokensCertificate'
import { STokensBridgeProxyAdmin } from '../typechain/STokensBridgeProxyAdmin'
import { STokensBridgeProxy } from '../typechain/STokensBridgeProxy'

async function main() {
	//!please check!!!!!!!!!
	const sTokensManagerAddress = '0xD6D07f1c048bDF2B3d5d9B6c25eD1FC5348D0A70'
	//!!!!!!!!!!!!!!!!!!!!!!

	// STokensCertificate
	const sTokensCertificateFactory = await ethers.getContractFactory(
		'STokensCertificate'
	)
	const sTokensCertificate = await sTokensCertificateFactory.deploy() as STokensCertificate
	await sTokensCertificate.deployed()

	// sTokensBridge
	const sTokensBridgeFactory = await ethers.getContractFactory(
		'STokensBridge'
	)

	const sTokensBridge = await sTokensBridgeFactory.deploy() as STokensBridge
	await sTokensBridge.deployed()

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


	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log('sTokensCertificateProxy deployed to:', sTokensCertificateProxy.address)
	console.log('sTokensBridge deployed to:', sTokensBridge.address)
	console.log('sTokensBridgeProxy deployed to:', sTokensBridgeProxy.address)
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