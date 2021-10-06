/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ethers, upgrades } from 'hardhat'

async function main() {
	//!please check!!!!!!!!!
	const sTokensManagerAddress = '0xD6D07f1c048bDF2B3d5d9B6c25eD1FC5348D0A70'
	//!!!!!!!!!!!!!!!!!!!!!!

	// STokensCertificate
	const STokensCertificate = await ethers.getContractFactory("STokensCertificate");
	// Do not initialize because initialize will be implemented by Bridge initialize()
	const sTokensCertificate = await upgrades.deployProxy(STokensCertificate, { initializer: false });

	// STokensBridge
	const STokensBridge = await ethers.getContractFactory("STokensBridge");
	const sTokensBridge = await upgrades.deployProxy(STokensBridge, [sTokensManagerAddress, sTokensCertificate.address]);


	console.log('sTokensCertificate deployed to:', sTokensCertificate.address)
	console.log('sTokensBridge deployed to:', sTokensBridge.address)
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
