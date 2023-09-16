# [0.1.0-develop.59](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.58...v0.1.0-develop.59) (2023-09-16)


### Bug Fixes

* if syncing manual, set latest period to value of getCurrentPeriod() before optimistic update ([e742ec8](https://git.lumeweb.com/LumeWeb/libethsync/commit/e742ec8b6482d63469381670ae3f70653757a4fc))
* send a dummy update event for chain progress ([417da9f](https://git.lumeweb.com/LumeWeb/libethsync/commit/417da9f89302bded91066ab33722fc89adfbd76e))

# [0.1.0-develop.58](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.57...v0.1.0-develop.58) (2023-09-16)


### Bug Fixes

* bad import ([5687e13](https://git.lumeweb.com/LumeWeb/libethsync/commit/5687e13f9d0a9bb2473829a5dd780948c0478bcc))

# [0.1.0-develop.57](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.56...v0.1.0-develop.57) (2023-09-16)


### Bug Fixes

* need to init bls in manual ([d1e88ce](https://git.lumeweb.com/LumeWeb/libethsync/commit/d1e88ce87fa908ca47c176937decd5be96456b0c))

# [0.1.0-develop.56](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.55...v0.1.0-develop.56) (2023-09-16)


### Bug Fixes

* if we are within 1 period of getCurrentPeriod manually call sync actions, otherwise call parent sync ([6500219](https://git.lumeweb.com/LumeWeb/libethsync/commit/65002190b834c5a31c5c8ca1dcf0f5953f83594d))

# [0.1.0-develop.55](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.54...v0.1.0-develop.55) (2023-09-16)


### Bug Fixes

* as a properly synced node may never hit the computed period at getCurrentPeriod... need to manually emit synced and call getLatestExecution ([19c59eb](https://git.lumeweb.com/LumeWeb/libethsync/commit/19c59eb18944bd6528983fec0f848143aed4742a))

# [0.1.0-develop.54](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.53...v0.1.0-develop.54) (2023-09-16)


### Bug Fixes

* if startPeriod is greater than genesisPeriod, try to use latestCommittee falling back to genesisCommittee ([ec84027](https://git.lumeweb.com/LumeWeb/libethsync/commit/ec8402714f6f9c7ec405c465ea6cc965eabacad5))

# [0.1.0-develop.53](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.52...v0.1.0-develop.53) (2023-09-16)


### Bug Fixes

* bad import ([b9b8b26](https://git.lumeweb.com/LumeWeb/libethsync/commit/b9b8b26ea478fce2ed9a3c9c94fa09846b5feca7))

# [0.1.0-develop.52](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.51...v0.1.0-develop.52) (2023-09-16)


### Features

* add syncFromCheckpoint method ([ccaca65](https://git.lumeweb.com/LumeWeb/libethsync/commit/ccaca65a900ec75adc1605e5b22caab4182587dd))

# [0.1.0-develop.51](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.50...v0.1.0-develop.51) (2023-09-16)


### Bug Fixes

* IStore should extend EventEmitter ([9f00d8f](https://git.lumeweb.com/LumeWeb/libethsync/commit/9f00d8fec80d05592974d28c557117419027d21e))

# [0.1.0-develop.50](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.49...v0.1.0-develop.50) (2023-09-16)


### Features

* have Store extend EventEmitter so that it can emit set on adding an update and pass the serialized data ([295aed0](https://git.lumeweb.com/LumeWeb/libethsync/commit/295aed0845249ab81852e4106de66fdca3c5885e))

# [0.1.0-develop.49](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.48...v0.1.0-develop.49) (2023-07-25)


### Bug Fixes

* add try/catch with mutex release on optimisticUpdateCallback ([7075966](https://git.lumeweb.com/LumeWeb/libethsync/commit/7075966227515151490639b0f22a804d6e3b2583))

# [0.1.0-develop.48](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.47...v0.1.0-develop.48) (2023-07-24)


### Bug Fixes

* don't release lock when we have cached optimistic update data, as we never locked it ([d3664c8](https://git.lumeweb.com/LumeWeb/libethsync/commit/d3664c8d23c1bbfef53816542f47fc211f94c63c))

# [0.1.0-develop.47](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.46...v0.1.0-develop.47) (2023-07-24)


### Bug Fixes

* incorporate upstream https://github.com/lightclients/patronum/pull/23 ([8b7c85d](https://git.lumeweb.com/LumeWeb/libethsync/commit/8b7c85dd61c585d96e711deca5d0e014a5aa1d12))

# [0.1.0-develop.46](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.45...v0.1.0-develop.46) (2023-07-23)


### Features

* add synced event ([0321136](https://git.lumeweb.com/LumeWeb/libethsync/commit/0321136ac00216e6e009f531ffcfb25a4b8f3e09))

# [0.1.0-develop.45](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.44...v0.1.0-develop.45) (2023-07-23)


### Bug Fixes

* change argument to be the current update, not the 0 index ([87e7533](https://git.lumeweb.com/LumeWeb/libethsync/commit/87e7533dcfdad99c534b5f54f63e2c1ccb08d769))

# [0.1.0-develop.44](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.43...v0.1.0-develop.44) (2023-07-23)

# [0.1.0-develop.43](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.42...v0.1.0-develop.43) (2023-07-23)


### Features

* use event emitter and emit "update" on every light client update processed ([232af83](https://git.lumeweb.com/LumeWeb/libethsync/commit/232af830c9c844fa5b6f2e5b4c50c2f0a067188e))

# [0.1.0-develop.42](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.41...v0.1.0-develop.42) (2023-07-15)

# [0.1.0-develop.41](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.40...v0.1.0-develop.41) (2023-07-14)


### Features

* add loggerInfo and loggerErr callbacks to client options ([a901ee7](https://git.lumeweb.com/LumeWeb/libethsync/commit/a901ee76f4703d6e7f4793e96cfe173037f2103f))

# [0.1.0-develop.40](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.39...v0.1.0-develop.40) (2023-07-14)


### Bug Fixes

* add a sync delay option so that the bls verification does not hog cpu ([824dcd9](https://git.lumeweb.com/LumeWeb/libethsync/commit/824dcd96339410ffa9f0afb744a1baf3bed722d6))

# [0.1.0-develop.39](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.38...v0.1.0-develop.39) (2023-07-13)


### Bug Fixes

* compare code against codehash ([dc4c6b3](https://git.lumeweb.com/LumeWeb/libethsync/commit/dc4c6b3f3635a60ebc6e1a7be9811ff5ada9df66))

# [0.1.0-develop.38](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.37...v0.1.0-develop.38) (2023-07-13)


### Bug Fixes

* add map to return data property ([3e27281](https://git.lumeweb.com/LumeWeb/libethsync/commit/3e27281a3568c7979bb9a185a2081f9e571e5b07))

# [0.1.0-develop.37](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.36...v0.1.0-develop.37) (2023-07-13)


### Bug Fixes

* parse from u, not u.data ([8677bc1](https://git.lumeweb.com/LumeWeb/libethsync/commit/8677bc1294a81d37f42cd23d1b7860c458a93e19))

# [0.1.0-develop.36](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.35...v0.1.0-develop.36) (2023-07-13)


### Bug Fixes

* need to use concat not push ([b87017e](https://git.lumeweb.com/LumeWeb/libethsync/commit/b87017eb678282bf47758ca834e2acbc1cf6e516))
* Revert "fix: create fixSerializedUint8Array helper method to deal with weird quirk of ssz serialize" ([6ef18db](https://git.lumeweb.com/LumeWeb/libethsync/commit/6ef18dbc05b5b5801a6b05cea5056d631e8a094d))
* temporarily disable block hash check as it is bugged ([91144cb](https://git.lumeweb.com/LumeWeb/libethsync/commit/91144cb5a2b5d05fd301b11501861aadd10a69b5))
* use byteArrayEquals ([157811b](https://git.lumeweb.com/LumeWeb/libethsync/commit/157811b2348fa94d5d6b076219f34b3b340a50ac))

# [0.1.0-develop.35](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.34...v0.1.0-develop.35) (2023-07-13)


### Bug Fixes

* need to disable useClones in node cache ([07845bf](https://git.lumeweb.com/LumeWeb/libethsync/commit/07845bf4d024f2c62d656201beb97123a3052a3a))

# [0.1.0-develop.34](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.33...v0.1.0-develop.34) (2023-07-13)


### Bug Fixes

* create fixSerializedUint8Array helper method to deal with weird quirk of ssz serialize ([d8430b4](https://git.lumeweb.com/LumeWeb/libethsync/commit/d8430b4a11f99f38f33cf14abfc9ed841e5226e1))

# [0.1.0-develop.33](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.32...v0.1.0-develop.33) (2023-07-13)

# [0.1.0-develop.32](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.31...v0.1.0-develop.32) (2023-07-13)


### Features

* add getCurrentBlock and getLastBlock methods ([661e146](https://git.lumeweb.com/LumeWeb/libethsync/commit/661e146636a9f685e8cbae04c52b1d0a1ede3bff))

# [0.1.0-develop.31](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.30...v0.1.0-develop.31) (2023-07-13)

# [0.1.0-develop.30](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.29...v0.1.0-develop.30) (2023-07-13)

# [0.1.0-develop.29](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.28...v0.1.0-develop.29) (2023-07-13)

# [0.1.0-develop.28](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.27...v0.1.0-develop.28) (2023-07-13)


### Bug Fixes

* add optimisticUpdateCallback to client factory ([c3b47e6](https://git.lumeweb.com/LumeWeb/libethsync/commit/c3b47e67e760aea5c841985ab4d44fb36cff1dae))
* add optimisticUpdateCallback to options ([464fb21](https://git.lumeweb.com/LumeWeb/libethsync/commit/464fb2109514b147b25d1d760eb4a7677ac8fea3))
* pass client to prover after creating client in factory. don't try to parse thr messages ([481757e](https://git.lumeweb.com/LumeWeb/libethsync/commit/481757e019729ce3790c5cd07cb89c5d7ded7cf4))
* simplify logic and use LightClientUpdate.fromJson ([17cb002](https://git.lumeweb.com/LumeWeb/libethsync/commit/17cb00231c44d734cb6f24f48d1a6a045f0c7ae4))
* use _client not client ([76e22fa](https://git.lumeweb.com/LumeWeb/libethsync/commit/76e22fa34258c771da281457e983a5addfef440b))

# [0.1.0-develop.27](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.26...v0.1.0-develop.27) (2023-07-12)


### Bug Fixes

* fix import ([baa9562](https://git.lumeweb.com/LumeWeb/libethsync/commit/baa9562749e34db490997b62f5a8f370b355945c))

# [0.1.0-develop.26](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.25...v0.1.0-develop.26) (2023-07-12)

# [0.1.0-develop.25](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.24...v0.1.0-develop.25) (2023-07-12)

# [0.1.0-develop.24](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.23...v0.1.0-develop.24) (2023-07-11)


### Bug Fixes

* syncFromGenesis was a no-op ([822b0b4](https://git.lumeweb.com/LumeWeb/libethsync/commit/822b0b46b6efed5fab2908d6103e47bbf55fb957))

# [0.1.0-develop.23](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.22...v0.1.0-develop.23) (2023-07-11)


### Reverts

* Revert "fix: ensure @ethereumjs/util matches the version required by @ethereumjs/evm" ([bad87ac](https://git.lumeweb.com/LumeWeb/libethsync/commit/bad87ac7e101cd8106b3b60901e9a60adebd6848))

# [0.1.0-develop.22](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.21...v0.1.0-develop.22) (2023-07-11)


### Bug Fixes

* ensure @ethereumjs/util matches the version required by @ethereumjs/evm ([0949e8d](https://git.lumeweb.com/LumeWeb/libethsync/commit/0949e8d427b6a70497bc5c93bd6df5a72247b848))

# [0.1.0-develop.21](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.20...v0.1.0-develop.21) (2023-07-11)


### Bug Fixes

* @noble/curves import ([5c8394a](https://git.lumeweb.com/LumeWeb/libethsync/commit/5c8394af2d4561247605181720e799fc5c271f17))

# [0.1.0-develop.20](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.19...v0.1.0-develop.20) (2023-07-11)

# [0.1.0-develop.19](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.18...v0.1.0-develop.19) (2023-07-11)


### Features

* add getter for provider ([b85e177](https://git.lumeweb.com/LumeWeb/libethsync/commit/b85e1779ee7e4d8fccb6c7b8ee0e66f332823d19))

# [0.1.0-develop.18](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.17...v0.1.0-develop.18) (2023-07-11)


### Bug Fixes

* update ProverRequestCallback type to return a promise ([0884030](https://git.lumeweb.com/LumeWeb/libethsync/commit/08840308f8f0eb3560bbac4855222c8b4af46887))

# [0.1.0-develop.17](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.16...v0.1.0-develop.17) (2023-07-11)


### Bug Fixes

* beacon url is not used on the client side ([f353b3e](https://git.lumeweb.com/LumeWeb/libethsync/commit/f353b3e102438fa5d0af434519e3cd1927b85d75))

# [0.1.0-develop.16](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.15...v0.1.0-develop.16) (2023-07-11)


### Bug Fixes

* fix reference to isValidLightClientHeader ([0f8746d](https://git.lumeweb.com/LumeWeb/libethsync/commit/0f8746dac2442086cc4355a00c80c93178383141))

# [0.1.0-develop.15](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.14...v0.1.0-develop.15) (2023-07-11)


### Bug Fixes

* implement isValidLightClientHeader ([6f07421](https://git.lumeweb.com/LumeWeb/libethsync/commit/6f07421fe80f008255cbe472204d8530e2bb3352))

# [0.1.0-develop.14](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.13...v0.1.0-develop.14) (2023-07-11)


### Bug Fixes

* further chainConfig fixes ([8b11911](https://git.lumeweb.com/LumeWeb/libethsync/commit/8b1191165addc8bd981b57a62e3870e54bb6c0ea))

# [0.1.0-develop.13](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.12...v0.1.0-develop.13) (2023-07-11)


### Bug Fixes

* use call to getDefaultClientConfig to get chain config ([948d4d6](https://git.lumeweb.com/LumeWeb/libethsync/commit/948d4d610939e4f19210c187eec9e03d89060cd4))

# [0.1.0-develop.12](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.11...v0.1.0-develop.12) (2023-07-11)


### Bug Fixes

* fix usage of deserializeSyncCommittee ([80fdc45](https://git.lumeweb.com/LumeWeb/libethsync/commit/80fdc45ccd3993e96a57849bd3acae75cf46eb76))

# [0.1.0-develop.11](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.10...v0.1.0-develop.11) (2023-07-11)


### Bug Fixes

* return data property from update ([a5c0153](https://git.lumeweb.com/LumeWeb/libethsync/commit/a5c01533fe81f12b0651c6e039bb9f29b7c0ec93))

# [0.1.0-develop.10](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.9...v0.1.0-develop.10) (2023-07-11)

# [0.1.0-develop.9](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.8...v0.1.0-develop.9) (2023-07-11)


### Bug Fixes

* getConsensusOptimisticUpdate does not return ([67827c3](https://git.lumeweb.com/LumeWeb/libethsync/commit/67827c3776171caf0699e5449307c3731fc81b9a))

# [0.1.0-develop.8](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.7...v0.1.0-develop.8) (2023-07-11)

# [0.1.0-develop.7](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.6...v0.1.0-develop.7) (2023-07-11)


### Bug Fixes

* export RPC types ([bfa5d22](https://git.lumeweb.com/LumeWeb/libethsync/commit/bfa5d227a056a11b3aed61087d5c3c5b1006e43d))

# [0.1.0-develop.6](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.5...v0.1.0-develop.6) (2023-07-11)

# [0.1.0-develop.5](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.4...v0.1.0-develop.5) (2023-07-11)


### Bug Fixes

* add missing methods to IStore interface ([52aca21](https://git.lumeweb.com/LumeWeb/libethsync/commit/52aca21b781160055b57ec983edd1ed8e9c0e3e4))

# [0.1.0-develop.4](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.3...v0.1.0-develop.4) (2023-07-11)


### Bug Fixes

* add getter for store in baseclient ([3a48a52](https://git.lumeweb.com/LumeWeb/libethsync/commit/3a48a52a5397b6ae02406a05e90a623fc920b875))

# [0.1.0-develop.3](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.2...v0.1.0-develop.3) (2023-07-11)


### Bug Fixes

* export all interfaces ([a50271e](https://git.lumeweb.com/LumeWeb/libethsync/commit/a50271ec5bb2f8f702b70fc450f64fba7a5ab0e8))

# [0.1.0-develop.2](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.1.0-develop.1...v0.1.0-develop.2) (2023-07-11)


### Bug Fixes

* trigger release ([0bc05bf](https://git.lumeweb.com/LumeWeb/libethsync/commit/0bc05bf6ca4d03b29f293cf90834683b545ef499))

# [0.1.0-develop.1](https://git.lumeweb.com/LumeWeb/libethsync/compare/v0.0.1...v0.1.0-develop.1) (2023-07-11)


### Bug Fixes

* add missing repository to package.json ([127b1aa](https://git.lumeweb.com/LumeWeb/libethsync/commit/127b1aa0d7f312ebfbc9ab1c88b595ecdc6b8e7a))
* export createDefaultClient ([5d1bdec](https://git.lumeweb.com/LumeWeb/libethsync/commit/5d1bdec620a0e077849606860634e935cdc2bd19))


### Features

* Initial version ([24cd98b](https://git.lumeweb.com/LumeWeb/libethsync/commit/24cd98bb3ccb888400fe9e205fc45606c934f879))
* Initial version ([5843acb](https://git.lumeweb.com/LumeWeb/libethsync/commit/5843acb79bacca113cf08c9fd64a3edb6f97dc5c))
