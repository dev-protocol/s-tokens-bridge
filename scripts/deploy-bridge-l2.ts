/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers } from 'hardhat'

async function main() {
	//!please check!!!!!!!!!
	const sTokensManagerAddress = ''
	const adminAddress = ''
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

	// STokensBridgeProxy
	const sTokensBridgeProxyFactory = await ethers.getContractFactory(
		'STokensBridgeProxy'
	)

	// STokensCertificateProxy
	const data = ethers.utils.arrayify('0x')

	const sTokensCertificateProxy = await sTokensBridgeProxyFactory.deploy(
		sTokensCertificate.address,
		adminAddress,
		data
	)!
	await sTokensCertificateProxy.deployed()

	// STokensBridgeProxy
	const sTokensBridgeL2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridgeL2.address,
		adminAddress,
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
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
