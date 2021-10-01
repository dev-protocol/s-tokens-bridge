/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers } from 'hardhat'

async function main() {
	//!please check!!!!!!!!!
	const sTokensManagerAddress = '0xD6D07f1c048bDF2B3d5d9B6c25eD1FC5348D0A70'
	//!!!!!!!!!!!!!!!!!!!!!!

	// STokensCertificate
	const sTokensCertificateFactory = await ethers.getContractFactory(
		'STokensCertificate'
	)
	const sTokensCertificate = await sTokensCertificateFactory.deploy()!
	await sTokensCertificate.deployed()

	// STokensBridge
	const sTokensBridgeFactory = await ethers.getContractFactory('STokensBridge')

	const sTokensBridge = await sTokensBridgeFactory.deploy()!
	await sTokensBridge.deployed()

	// STokensBridgeProxyAdmin
	const sTokensBridgeProxyAdminFactory = await ethers.getContractFactory(
		'STokensBridgeProxyAdmin'
	)
	const sTokensBridgeProxyAdmin = await sTokensBridgeProxyAdminFactory.deploy()!
	await sTokensBridgeProxyAdmin.deployed()

	// STokensBridgeProxy
	const sTokensBridgeProxyFactory = await ethers.getContractFactory(
		'STokensBridgeProxy'
	)

	// STokensCertificateProxy
	const data = ethers.utils.arrayify('0x')

	const sTokensCertificateProxy = await sTokensBridgeProxyFactory.deploy(
		sTokensCertificate.address,
		sTokensBridgeProxyAdmin.address,
		data
	)!
	await sTokensCertificateProxy.deployed()

	// STokensBridgeProxy
	const sTokensBridgeProxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridge.address,
		sTokensBridgeProxyAdmin.address,
		data
	)!
	await sTokensBridgeProxy.deployed()

	const proxy = sTokensBridgeFactory.attach(sTokensBridgeProxy.address)!
	await proxy.initialize(sTokensManagerAddress, sTokensCertificateProxy.address)

	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log(
		'sTokensCertificateProxy deployed to:',
		sTokensCertificateProxy.address
	)
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
