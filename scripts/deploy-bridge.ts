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
	const sTokensBridgeFactory = await ethers.getContractFactory('STokensBridge')

	const sTokensBridge = await sTokensBridgeFactory.deploy()!
	await sTokensBridge.deployed()

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
	const sTokensBridgeProxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridge.address,
		adminAddress,
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
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
