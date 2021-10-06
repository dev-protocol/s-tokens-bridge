/* eslint-disable spaced-comment */
import { ethers, upgrades } from 'hardhat'

import { STokensBridgeL2 } from '../typechain/STokensBridgeL2'
import { STokensCertificate } from '../typechain/STokensCertificate'

async function main() {
	//!please check!!!!!!!!!
	const sTokensManagerAddress = '0xD6D07f1c048bDF2B3d5d9B6c25eD1FC5348D0A70'
	//!!!!!!!!!!!!!!!!!!!!!!

	// STokensCertificate
	const STokensCertificate = await ethers.getContractFactory(
		'STokensCertificate'
	)
	// Do not initialize because initialize will be implemented by Bridge initialize()
	const sTokensCertificate = (await upgrades.deployProxy(STokensCertificate, {
		initializer: false,
	})) as STokensCertificate

	// STokensBridgeL2
	const STokensBridgeL2 = await ethers.getContractFactory('STokensBridgeL2')
	const sTokensBridgeL2 = (await upgrades.deployProxy(STokensBridgeL2, [
		sTokensManagerAddress,
		sTokensCertificate.address,
	])) as STokensBridgeL2

	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log('sTokensBridgeL2 deployed to:', sTokensBridgeL2.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
