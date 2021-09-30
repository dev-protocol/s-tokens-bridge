/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ethers } from 'hardhat'
import { STokensBridgeL2 } from '../typechain/STokensBridgeL2'
import { STokensBridgeProxy } from '../typechain/STokensBridgeProxy'

async function main() {
	//!please check!!!!!!!!!
	const sTokensManagerL2Address = '0xD6D07f1c048bDF2B3d5d9B6c25eD1FC5348D0A70'
	const sTokensCertificateAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
	const sTokensBridgeProxyAdminAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
	//!!!!!!!!!!!!!!!!!!!!!!

	// sTokensBridgeL2
	const sTokensBridgeL2Factory = await ethers.getContractFactory(
		'STokensBridgeL2'
	)

	const sTokensBridgeL2 = await sTokensBridgeL2Factory.deploy() as STokensBridgeL2
	await sTokensBridgeL2.deployed()

	// STokensBridgeProxy
	const sTokensBridgeProxyFactory = await ethers.getContractFactory(
		'STokensBridgeProxy'
	)

	// sTokensCertificateProxy
	const data = ethers.utils.arrayify('0x')

	const sTokensCertificateL2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensCertificateAddress,
		sTokensBridgeProxyAdminAddress,
		data
	) as STokensBridgeProxy
	await sTokensCertificateL2Proxy.deployed()

	// sTokensBridgeL2Proxy
	const sTokensBridgeL2Proxy = await sTokensBridgeProxyFactory.deploy(
		sTokensBridgeL2.address,
		sTokensBridgeProxyAdminAddress,
		data
	) as STokensBridgeProxy
	await sTokensBridgeL2Proxy.deployed()

	const proxyL2 = sTokensBridgeL2Factory.attach(sTokensBridgeL2Proxy.address) as STokensBridgeL2
	await proxyL2.initialize(
		sTokensManagerL2Address,
		sTokensCertificateL2Proxy.address
	)

	console.log('sTokensCertificateL2Proxy deployed to:', sTokensCertificateL2Proxy.address)
	console.log('sTokensBridgeL2 deployed to:', sTokensBridgeL2.address)
	console.log('sTokensBridgeL2Proxy deployed to:', sTokensBridgeL2Proxy.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})