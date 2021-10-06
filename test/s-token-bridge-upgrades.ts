import { expect } from "chai";
import { ethers,waffle, upgrades } from 'hardhat';
import { mockSTokensManagerABI } from './mockABI'

const { deployMockContract } = waffle

describe("STokensCertificate", function () {
    it('works', async () => {
		const [, user] = await ethers.getSigners()

        // Ceritificate
        const STokensCertificate = await ethers.getContractFactory("STokensCertificate");
        const STokensCertificateV2 = await ethers.getContractFactory("STokensCertificate");

        // Do not initialize because initialize will be implemented by Bridge initialize()
        const sTokensCertificate = await upgrades.deployProxy(STokensCertificate, {initializer: false});

        // SToken
		const sTokensManagerMock = await deployMockContract(
			user,
			mockSTokensManagerABI
		)

        // Bridge
        const STokensBridge = await ethers.getContractFactory("STokensBridge");
        const STokensBridgeV2 = await ethers.getContractFactory("STokensBridge");

        const sTokensBridge = await upgrades.deployProxy(STokensBridge, [sTokensManagerMock.address, sTokensCertificate.address]);
        const sTokensBridgeUpgraded = await upgrades.upgradeProxy(sTokensBridge.address, STokensBridgeV2);

        // Check initialized constans of BridgeUpgraded
        const sTokensAddress = await sTokensBridgeUpgraded.sTokensAddress()
        expect(sTokensAddress).to.equal(sTokensManagerMock.address)
        const sTokensCertificateAddress = await sTokensBridgeUpgraded.sTokensCertificateProxyAddress()
        expect(sTokensCertificateAddress).to.equal(sTokensCertificate.address)

        // Check initialized constans of CertificateUpgraded
        const sTokensCertificateUpgraded = await upgrades.upgradeProxy(sTokensCertificate.address, STokensCertificateV2);
        const name = await sTokensCertificateUpgraded.name()
        expect(name).to.equal('sTokens Certificate V1')
        const symbol = await sTokensCertificateUpgraded.symbol()
        expect(symbol).to.equal('STOKENS-CERTIFICATE-V1')
    });
});
