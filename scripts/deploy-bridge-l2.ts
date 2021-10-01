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
	const sTokensBridgeL2Factory = await ethers.getContractFactory(
		'STokensBridgeL2'
	)

	const sTokensBridgeL2 = await sTokensBridgeL2Factory.deploy()!
	await sTokensBridgeL2.deployed()

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
	const sTokensBridgeL2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridgeL2.address,
		sTokensBridgeProxyAdmin.address,
		data
	)!
	await sTokensBridgeL2Proxy.deployed()

	const proxy = sTokensBridgeL2Factory.attach(sTokensBridgeL2Proxy.address)!
	await proxy.initialize(sTokensManagerAddress, sTokensCertificateProxy.address)

	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log(
		'sTokensCertificateProxy deployed to:',
		sTokensCertificateProxy.address
	)
	console.log('sTokensBridgeL2 deployed to:', sTokensBridgeL2.address)
	console.log('sTokensBridgeProxyL2 deployed to:', sTokensBridgeL2Proxy.address)
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
