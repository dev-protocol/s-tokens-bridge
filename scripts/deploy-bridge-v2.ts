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
	const sTokensBridgeV2Factory = await ethers.getContractFactory(
		'STokensBridgeV2'
	)

	const sTokensBridgeV2 = await sTokensBridgeV2Factory.deploy()!
	await sTokensBridgeV2.deployed()

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
	const sTokensBridgeV2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridgeV2.address,
		adminAddress,
		data
	)!
	await sTokensBridgeV2Proxy.deployed()

	const proxy = sTokensBridgeV2Factory.attach(sTokensBridgeV2Proxy.address)!
	await proxy.initialize(sTokensManagerAddress, sTokensCertificateProxy.address)

	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log(
		'sTokensCertificateProxy deployed to:',
		sTokensCertificateProxy.address
	)
	console.log('sTokensBridgeV2 deployed to:', sTokensBridgeV2.address)
	console.log('sTokensBridgeProxyV2 deployed to:', sTokensBridgeV2Proxy.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
