const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("DigitalNotary", function () {
  const DOC_HASH = ethers.keccak256(ethers.toUtf8Bytes("deed #1"));
  const DOC_HASH_2 = ethers.keccak256(ethers.toUtf8Bytes("deed #2"));
  const CID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
  const REGISTRY = "WA4M/00123456/7";
  const DESC = "Property Sale Deed";

  async function deployFixture() {
    const [admin, notary1, notary2, outsider] = await ethers.getSigners();
    const DigitalNotary = await ethers.getContractFactory("DigitalNotary");
    const contract = await DigitalNotary.deploy(admin.address);
    await contract.addNotary(notary1.address);
    return { contract, admin, notary1, notary2, outsider };
  }

  describe("roles", function () {
    it("sets admin from constructor", async function () {
      const { contract, admin } = await loadFixture(deployFixture);
      expect(await contract.admin()).to.equal(admin.address);
    });

    it("rejects zero admin address", async function () {
      const DigitalNotary = await ethers.getContractFactory("DigitalNotary");
      await expect(
        DigitalNotary.deploy(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(DigitalNotary, "ZeroAddress");
    });

    it("allows admin to add/remove notary", async function () {
      const { contract, admin, notary2 } = await loadFixture(deployFixture);

      await expect(contract.addNotary(notary2.address))
        .to.emit(contract, "NotaryAdded")
        .withArgs(notary2.address, admin.address);
      expect(await contract.isNotary(notary2.address)).to.equal(true);

      await expect(contract.removeNotary(notary2.address))
        .to.emit(contract, "NotaryRemoved")
        .withArgs(notary2.address, admin.address);
      expect(await contract.isNotary(notary2.address)).to.equal(false);
    });

    it("rejects non-admin notary management", async function () {
      const { contract, outsider, notary2 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(outsider).addNotary(notary2.address),
      ).to.be.revertedWithCustomError(contract, "NotAdmin");
    });

    it("supports two-step admin transfer", async function () {
      const { contract, admin, notary2 } = await loadFixture(deployFixture);
      await contract.transferAdmin(notary2.address);
      await expect(contract.connect(notary2).acceptAdmin())
        .to.emit(contract, "AdminTransferred")
        .withArgs(admin.address, notary2.address);
      expect(await contract.admin()).to.equal(notary2.address);
    });
  });

  describe("documents", function () {
    it("registers document", async function () {
      const { contract, notary1 } = await loadFixture(deployFixture);
      await expect(
        contract.connect(notary1).registerDocument(DOC_HASH, CID, REGISTRY, DESC),
      ).to.emit(contract, "DocumentRegistered");

      const doc = await contract.verifyDocument(DOC_HASH);
      expect(doc.exists).to.equal(true);
      expect(doc.revoked).to.equal(false);
      expect(doc.notary).to.equal(notary1.address);
      expect(doc.ipfsCid).to.equal(CID);
      expect(doc.registryNumber).to.equal(REGISTRY);
      expect(doc.description).to.equal(DESC);
    });

    it("rejects non-notary registration", async function () {
      const { contract, outsider } = await loadFixture(deployFixture);
      await expect(
        contract.connect(outsider).registerDocument(DOC_HASH, CID, REGISTRY, DESC),
      ).to.be.revertedWithCustomError(contract, "NotNotary");
    });

    it("rejects duplicate hash", async function () {
      const { contract, notary1 } = await loadFixture(deployFixture);
      await contract.connect(notary1).registerDocument(DOC_HASH, CID, REGISTRY, DESC);
      await expect(
        contract.connect(notary1).registerDocument(DOC_HASH, CID, REGISTRY, DESC),
      ).to.be.revertedWithCustomError(contract, "DocumentAlreadyRegistered");
    });

    it("keeps audit history for registry", async function () {
      const { contract, notary1 } = await loadFixture(deployFixture);
      await contract.connect(notary1).registerDocument(DOC_HASH, CID, REGISTRY, "entry 1");
      await contract.connect(notary1).registerDocument(DOC_HASH_2, CID, REGISTRY, "entry 2");

      const history = await contract.getRegistryHistory(REGISTRY);
      expect(history).to.deep.equal([DOC_HASH, DOC_HASH_2]);
      expect(await contract.getRegistryDocumentCount(REGISTRY)).to.equal(2);
    });

    it("supports revocation", async function () {
      const { contract, notary1 } = await loadFixture(deployFixture);
      await contract.connect(notary1).registerDocument(DOC_HASH, CID, REGISTRY, DESC);
      await expect(contract.connect(notary1).revokeDocument(DOC_HASH, "invalid entry")).to.emit(
        contract,
        "DocumentRevoked",
      );

      const doc = await contract.verifyDocument(DOC_HASH);
      expect(doc.revoked).to.equal(true);
      expect(doc.revokeReason).to.equal("invalid entry");
    });
  });
});
