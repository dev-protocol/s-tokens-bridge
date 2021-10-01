/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ethers } from 'hardhat'
import { STokensBridgeL2 } from '../typechain/STokensBridgeL2'
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

	// sTokensBridgeProxy
	const sTokensBridgeL2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridgeL2.address,
		sTokensBridgeProxyAdmin.address,
		data
	) as STokensBridgeProxy
	await sTokensBridgeL2Proxy.deployed()

	const proxy = sTokensBridgeL2Factory.attach(sTokensBridgeL2Proxy.address) as STokensBridgeL2
	await proxy.initialize(
		sTokensManagerAddress,
		sTokensCertificateProxy.address
	)


	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log('sTokensCertificateProxy deployed to:', sTokensCertificateProxy.address)
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