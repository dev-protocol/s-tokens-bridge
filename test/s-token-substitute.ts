/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable new-cap */
import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { Contract, constants } from 'ethers'
import { solidity } from 'ethereum-waffle'
import {
	deploy,
	deployWithArg,
	deployWith2Arg,
	deployWith3Arg,
	createMintParams,
	createUpdateParams,
	attach
} from './utils'
import { HARDHAT_ERROR } from './const'
import { checkTokenUri } from './token-uri-test'
import { STokensBridge, STokensCertificate } from '../typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { messagePrefix } from '@ethersproject/hash'

use(solidity)

describe('STokensSubstitute', () => {
	const init = async (): Promise<[Contract, SignerWithAddress]> => {
		const [, user] = await ethers.getSigners()
		const sTokensSubstitute = await deploy('STokensSubstitute')
		return [sTokensSubstitute, user]
	}

	describe('name', () => {
		it('get token name', async () => {
			const [sTokensSubstitute, user] = await init()
			const name = await sTokensSubstitute.name()
			expect(name).to.equal('sTokens Substitute V1')
		})
	})
	describe('symbol', () => {
		it('get token symbol', async () => {
			const [sTokensSubstitute, user] = await init()
			const symbol = await sTokensSubstitute.symbol()
			expect(symbol).to.equal('STOKENS-SUBSTITUTE-V1')
		})
	})

	describe('mint', () => {
		describe('success', () => {
			it('owner mints user amount=1', async () => {
				const [sTokensSubstitute, user] = await init()
				await sTokensSubstitute.mint(user.address, 1)
				const balanceOfUser = await sTokensSubstitute.balanceOf(user.address)
				expect(balanceOfUser).to.equal(1)
			})
		})
		describe('fail', () => {
			it('user cannot mint', async () => {
				const [sTokensSubstitute, user] = await init()
				await expect(sTokensSubstitute.connect(user).mint(user.address, 1)).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})

	describe('burn', () => {
		describe('success', () => {
			it('owner burns user amount=1', async () => {
				const [sTokensSubstitute, user] = await init()
				await sTokensSubstitute.mint(user.address, 1)
				await sTokensSubstitute.burn(user.address, 1)
				const balanceOfUser = await sTokensSubstitute.balanceOf(user.address)
				expect(balanceOfUser).to.equal(0)
			})
		})

		describe('fail', () => {
			it('user cannot burn', async () => {
				const [sTokensSubstitute, user] = await init()
				await sTokensSubstitute.mint(user.address, 1)
				await expect(sTokensSubstitute.connect(user).burn(user.address, 1)).to.be.revertedWith('Ownable: caller is not the owner')
			})
		})
	})
})
