/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable new-cap */
import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { solidity } from 'ethereum-waffle'
import {
	deploy,
} from './utils'
import { STokensCertificate } from '../typechain/STokensCertificate'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

use(solidity)

describe('STokensCertificate', () => {
	const init = async (): Promise<[Contract, SignerWithAddress]> => {
		const [, user] = await ethers.getSigners()
		const sTokensCertificate = await deploy('STokensCertificate') as STokensCertificate
		await sTokensCertificate.initialize()
		return [sTokensCertificate, user]
	}

	describe('initialize', () => {
		it('The initialize function can only be executed once.', async () => {
			const [sTokensCertificate, user] = await init()
			await expect(
				sTokensCertificate.initialize()
			).to.be.revertedWith('Initializable: contract is already initialized')
		})
	})

	describe('name', () => {
		it('get token name', async () => {
			const [sTokensCertificate, user] = await init()
			const name = await sTokensCertificate.name()
			expect(name).to.equal('sTokens Certificate V1')
		})
	})
	describe('symbol', () => {
		it('get token symbol', async () => {
			const [sTokensCertificate, user] = await init()
			const symbol = await sTokensCertificate.symbol()
			expect(symbol).to.equal('STOKENS-CERTIFICATE-V1')
		})
	})

	describe('mint', () => {
		describe('success', () => {
			it('owner mints user certId=1', async () => {
				const [sTokensCertificate, user] = await init()
				await sTokensCertificate.mint(user.address, 1)
				const certificateOwner = await sTokensCertificate.ownerOf(1)
				expect(certificateOwner).to.equal(user.address)
			})
		})
		describe('fail', () => {
			it('user cannot mint', async () => {
				const [sTokensCertificate, user] = await init()
				await expect(sTokensCertificate.connect(user).mint(user.address, 1)).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})

	describe('burn', () => {
		describe('success', () => {
			it('owner burns certId=1 of user', async () => {
				const [sTokensCertificate, user] = await init()
				await sTokensCertificate.mint(user.address, 1)
				await sTokensCertificate.burn(1)
				await expect(sTokensCertificate.ownerOf(1)).to.be.revertedWith('ERC721: owner query for nonexistent token')
			})
		})

		describe('fail', () => {
			it('user cannot burn', async () => {
				const [sTokensCertificate, user] = await init()
				await sTokensCertificate.mint(user.address, 1)
				await expect(sTokensCertificate.connect(user).burn(1)).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
})
