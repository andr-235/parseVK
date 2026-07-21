# [0.62.0](https://github.com/andr-235/parseVK/compare/v0.61.0...v0.62.0) (2026-07-21)


### Features

* **content:** add version-aware upsert to prevent projection downgrade ([8590265](https://github.com/andr-235/parseVK/commit/8590265e85588793af149659619a52e33937259f))
* **im:** implement historical replay with replay-v2 dedupe namespace ([60d96f0](https://github.com/andr-235/parseVK/commit/60d96f02060acd29c0a3186431f4a3bb6b5f9c3d))
* **im:** merge PR-C2.0 projection hardening ([f62f6cf](https://github.com/andr-235/parseVK/commit/f62f6cf33259567adb5d47df5ac7df61e87c47f4))
* **im:** merge PR-C2.1 historical replay ([43ed4df](https://github.com/andr-235/parseVK/commit/43ed4df251db0bad5e82c47761e3699ba2b61688))

# [0.61.0](https://github.com/andr-235/parseVK/compare/v0.60.1...v0.61.0) (2026-07-21)


### Features

* **db:** add Alembic migration for im_messages projection_version + natural key ([042bca9](https://github.com/andr-235/parseVK/commit/042bca96be8cb8f375948dffe81864b049f86df8))
* **events:** add ImMessageCollectedPayload v2 contract ([490e13b](https://github.com/andr-235/parseVK/commit/490e13b3b9bc21223ae028b6054817450fce669d))
* **im:** add im.message_collected v2 snapshot contract ([14e41dd](https://github.com/andr-235/parseVK/commit/14e41dd23e3d76e96712c6a2a297d92e3e11d484))
* **im:** merge PR-C1 snapshot contract v2 ([17c24d7](https://github.com/andr-235/parseVK/commit/17c24d73eabe879b5edebbeee910b9663c3b7c65))

## [0.60.1](https://github.com/andr-235/parseVK/compare/v0.60.0...v0.60.1) (2026-07-21)


### Bug Fixes

* **migration:** add rollback marker to backfill and create alembic validation script ([a169542](https://github.com/andr-235/parseVK/commit/a1695424bf52add9ad666a6c8e914dce4126f5ce))

# [0.60.0](https://github.com/andr-235/parseVK/compare/v0.59.2...v0.60.0) (2026-07-21)


### Bug Fixes

* **migration:** linearize im-service Alembic graph and shorten content-service revision ID ([1d49f1f](https://github.com/andr-235/parseVK/commit/1d49f1f165dd48229622aeeb13b5ebc6e662e488))


### Features

* **api-gateway:** switch /monitoring/groups to im-service with response adapter ([7c60f14](https://github.com/andr-235/parseVK/commit/7c60f1430a09344f6b6ebb6bafe4b5665f606dbd))
* **content-service:** deprecate and remove duplicate MonitoringGroup ([bf74a06](https://github.com/andr-235/parseVK/commit/bf74a061e3c208585a20e5903c9dbfa4eb20ebaf))
* **im-service:** add im_group_id FK, category filter, and indexes to MonitoringGroup ([f7f8e4a](https://github.com/andr-235/parseVK/commit/f7f8e4a873465e56a5fdf03e33fd4aced4d88719))
* PR-B monitoring ownership cleanup (Merge branch 'feature/pr-b-monitoring-ownership-cleanup') ([836e031](https://github.com/andr-235/parseVK/commit/836e031033aef44835965fa296d3919e5b3571bc))

## [0.59.2](https://github.com/andr-235/parseVK/compare/v0.59.1...v0.59.2) (2026-07-17)


### Bug Fixes

* **vk-service,tasks-service:** extract HTTP from DB transaction, add FOR UPDATE locking, tests, and docs ([#279](https://github.com/andr-235/parseVK/issues/279)) ([6922b48](https://github.com/andr-235/parseVK/commit/6922b48647a06f15e7bac0d0aae8b44688aff542)), closes [#278](https://github.com/andr-235/parseVK/issues/278)
* **vk-service,tasks-service:** extract HTTP from DB transaction, add FOR UPDATE, tests, and docs ([632f67d](https://github.com/andr-235/parseVK/commit/632f67d808a61796b80e8e41415b1d965adfac26))
* **vk-service:** pass tasks_client to TaskEventsService, add wiring test ([c8185ce](https://github.com/andr-235/parseVK/commit/c8185ce51421f831532c0e782407c161b8a075ad))

## [0.59.1](https://github.com/andr-235/parseVK/compare/v0.59.0...v0.59.1) (2026-07-17)


### Bug Fixes

* **deploy:** repair Alembic migration heads ([#277](https://github.com/andr-235/parseVK/issues/277)) ([fb31b85](https://github.com/andr-235/parseVK/commit/fb31b85bd56add3c25dec4d802d510ffc472cb20))

# [0.59.0](https://github.com/andr-235/parseVK/compare/v0.58.1...v0.59.0) (2026-07-17)


### Features

* **eda:** add durable backoff, fix moderation consumer, optimize DLQ ([d782bb3](https://github.com/andr-235/parseVK/commit/d782bb393fe7c028eab59d1fc52e78f736758267))
* **eda:** unify consumer_name across 5 services; remove TaskEventMapper ([6ac3b8b](https://github.com/andr-235/parseVK/commit/6ac3b8b65c6d1e379bce65bdb73ee3dd9891c667))

## [0.58.1](https://github.com/andr-235/parseVK/compare/v0.58.0...v0.58.1) (2026-07-17)


### Bug Fixes

* **vk-service:** recover stuck parsing tasks with leased workers ([#275](https://github.com/andr-235/parseVK/issues/275)) ([6d87b19](https://github.com/andr-235/parseVK/commit/6d87b19e2d5b213f56a1c11cf6f6fe53235446df)), closes [#274](https://github.com/andr-235/parseVK/issues/274) [#274](https://github.com/andr-235/parseVK/issues/274)

# [0.58.0](https://github.com/andr-235/parseVK/compare/v0.57.0...v0.58.0) (2026-07-16)


### Features

* add shared background worker runtime with WorkerHealth and supervise ([24ceb99](https://github.com/andr-235/parseVK/commit/24ceb99a25ae4e472209a4df6837a083dd1962b0))

# [0.57.0](https://github.com/andr-235/parseVK/compare/v0.56.0...v0.57.0) (2026-07-16)


### Features

* **tasks-service:** add per-user transaction isolation for automation scheduler, cap to 100 owners/cycle, remove list_enabled_settings ([a7f5729](https://github.com/andr-235/parseVK/commit/a7f5729936665f9b9f3950be69b52aabe2afe8aa))
* **tasks-service:** add typed WorkerHealth dataclass replacing list[bool] health flags, update dependent tests ([20d2944](https://github.com/andr-235/parseVK/commit/20d2944247a5dfb0f1d17a041020bbe5f07344a9))

# [0.56.0](https://github.com/andr-235/parseVK/compare/v0.55.1...v0.56.0) (2026-07-16)


### Features

* **tasks-service:** harden DLQ production and add monitoring metric ([c24cf65](https://github.com/andr-235/parseVK/commit/c24cf65a0be8a74775c8ff78d84a55eb187e5674))

## [0.55.1](https://github.com/andr-235/parseVK/compare/v0.55.0...v0.55.1) (2026-07-16)


### Bug Fixes

* **tasks-service:** add outbox events for task.completed and task.failed + update ARCHITECTURE.md ([751c0ae](https://github.com/andr-235/parseVK/commit/751c0ae534ff0d9249e96713f9b7be08b18f7573))
* **tasks-service:** remove permanent outbox dedupe_key for automation_settings_updated ([14afc82](https://github.com/andr-235/parseVK/commit/14afc825965dda52b32a18e81d98c34b2ff5a3ac))

# [0.55.0](https://github.com/andr-235/parseVK/compare/v0.54.1...v0.55.0) (2026-07-01)


### Features

* **listings-service:** add pydantic schemas and refactor service layer ([b5deef0](https://github.com/andr-235/parseVK/commit/b5deef075b88e8902f02184607420416cfddddf2))

## [0.54.1](https://github.com/andr-235/parseVK/compare/v0.54.0...v0.54.1) (2026-07-01)


### Bug Fixes

* **vk-service:** handle VK API 212 error, improve infra error detection ([b7bb43a](https://github.com/andr-235/parseVK/commit/b7bb43a800d7e7c649c72974bf452fa67357f894))

# [0.54.0](https://github.com/andr-235/parseVK/compare/v0.53.1...v0.54.0) (2026-07-01)


### Bug Fixes

* **export:** align input/button sizing with design system ([9bd8e02](https://github.com/andr-235/parseVK/commit/9bd8e0266c1380a4ff10f422f2125b6d682e6a6b))


### Features

* **export:** add error states and SSE retry feedback ([b6164f6](https://github.com/andr-235/parseVK/commit/b6164f64d20ef498d34451a38df8a5ba1dd5cac1))

## [0.53.1](https://github.com/andr-235/parseVK/compare/v0.53.0...v0.53.1) (2026-06-30)


### Bug Fixes

* **vk-service:** send access_token for OK API RPC calls ([2c95092](https://github.com/andr-235/parseVK/commit/2c95092e75d317abadfdd24fabbfd7bf55a49867))

# [0.53.0](https://github.com/andr-235/parseVK/compare/v0.52.6...v0.53.0) (2026-06-30)


### Features

* **vk-service:** close OK friends NestJS migration gaps ([8a96789](https://github.com/andr-235/parseVK/commit/8a967894bb762248cd38d2f730bb50a8533f1c65))

## [0.52.6](https://github.com/andr-235/parseVK/compare/v0.52.5...v0.52.6) (2026-06-30)


### Bug Fixes

* **ok-client:** send both access_token and session_key for REST API methods ([7e67fe9](https://github.com/andr-235/parseVK/commit/7e67fe93691e601787938589591cb40c4d0f217a))

## [0.52.5](https://github.com/andr-235/parseVK/compare/v0.52.4...v0.52.5) (2026-06-30)


### Bug Fixes

* **ok-client:** use correct parameter name for access token in REST API calls ([1352ba9](https://github.com/andr-235/parseVK/commit/1352ba99b44953be60b1b1f181813fe9be9d8001))

## [0.52.4](https://github.com/andr-235/parseVK/compare/v0.52.3...v0.52.4) (2026-06-30)


### Bug Fixes

* **vk-service:** commit job before background task and add OK API credentials ([cb1a31d](https://github.com/andr-235/parseVK/commit/cb1a31de6682626f40cbe55e04b58526c03c1e30))

## [0.52.3](https://github.com/andr-235/parseVK/compare/v0.52.2...v0.52.3) (2026-06-29)


### Bug Fixes

* **front:** retry SSE stream on 404 after job creation ([4c7c897](https://github.com/andr-235/parseVK/commit/4c7c8973deccd6ab991771af6949bf3dcefe8aef))

## [0.52.2](https://github.com/andr-235/parseVK/compare/v0.52.1...v0.52.2) (2026-06-29)


### Bug Fixes

* **front:** replace EventSource with fetch for SSE auth ([5120643](https://github.com/andr-235/parseVK/commit/5120643b50b0d11edd96ec2d0f1855de5bc7fa03))

## [0.52.1](https://github.com/andr-235/parseVK/compare/v0.52.0...v0.52.1) (2026-06-29)


### Bug Fixes

* **friends-export:** simplify export forms ([21b666f](https://github.com/andr-235/parseVK/commit/21b666f269073d98e55320fc5e98e1ed3a72257b))

# [0.52.0](https://github.com/andr-235/parseVK/compare/v0.51.0...v0.52.0) (2026-06-29)


### Features

* **friends-export:** redesign export pages ([5ced43a](https://github.com/andr-235/parseVK/commit/5ced43a749b797f31638a315f6c7764735012473))

# [0.51.0](https://github.com/andr-235/parseVK/compare/v0.50.5...v0.51.0) (2026-06-29)


### Features

* **front:** add shared friends export types ([232c860](https://github.com/andr-235/parseVK/commit/232c860709eb6493b2607b938efb94219ffacbe6))
* **front:** add shared useFriendsExportStream hook ([f3ffa67](https://github.com/andr-235/parseVK/commit/f3ffa677fb6added1855b8754bb3ff8e170aa6c2))
* **front:** add VK/OK friends export API modules ([923a530](https://github.com/andr-235/parseVK/commit/923a530af790b6e21706999ea1d8e039d586312c))
* **front:** implement OK friends export page ([db0e859](https://github.com/andr-235/parseVK/commit/db0e859cd8b7c4bc3e27a4589e18b10cfc81d102))
* **front:** implement VK friends export page ([7e21c5c](https://github.com/andr-235/parseVK/commit/7e21c5ced90a2245f664bf634b4327aec3ac8681))

## [0.50.5](https://github.com/andr-235/parseVK/compare/v0.50.4...v0.50.5) (2026-06-26)


### Bug Fixes

* **front:** TS error - total can be null in keyword search type ([ae5f626](https://github.com/andr-235/parseVK/commit/ae5f626d05da880515ac4e2807cffda07c2355a5))
* **im-service:** correct cursor semantics for keyword search ([172c594](https://github.com/andr-235/parseVK/commit/172c5947986b364c7b3de50585c38b2b9a9d4b5c))

## [0.50.4](https://github.com/andr-235/parseVK/compare/v0.50.3...v0.50.4) (2026-06-26)


### Performance Improvements

* **im-service:** replace ILIKE keyword search with Python-side filtering and cursor pagination ([04a5fa0](https://github.com/andr-235/parseVK/commit/04a5fa0f3c1233aeb64daaf2457e38e1d41a3856))

## [0.50.3](https://github.com/andr-235/parseVK/compare/v0.50.2...v0.50.3) (2026-06-26)


### Bug Fixes

* **monitoring:** ensure kwMessagesQuery only fires when keywords are loaded ([313f618](https://github.com/andr-235/parseVK/commit/313f6188c578287c0dc72ee50620e67f96219802))

## [0.50.2](https://github.com/andr-235/parseVK/compare/v0.50.1...v0.50.2) (2026-06-26)


### Performance Improvements

* **im-service:** use ILIKE ANY and composite GIN index for keyword search ([ff20db9](https://github.com/andr-235/parseVK/commit/ff20db998e01f949df602e2df1ae118af0bfaac3))

## [0.50.1](https://github.com/andr-235/parseVK/compare/v0.50.0...v0.50.1) (2026-06-26)


### Bug Fixes

* **monitoring:** split messages query to prevent placeholderData cross-mode leak ([5635920](https://github.com/andr-235/parseVK/commit/5635920946575412df35026e68ed3ff603017b20))

# [0.50.0](https://github.com/andr-235/parseVK/compare/v0.49.4...v0.50.0) (2026-06-26)


### Features

* **monitoring:** make keywords collapsible and fix onlyWithKeywords alias ([0fbb080](https://github.com/andr-235/parseVK/commit/0fbb08023ac6c554ec7fa809db3953b07e29c865))

## [0.49.4](https://github.com/andr-235/parseVK/compare/v0.49.3...v0.49.4) (2026-06-26)


### Bug Fixes

* **im-service:** add aliases for camelCase fields in SearchMessagesRequest ([3ff91dd](https://github.com/andr-235/parseVK/commit/3ff91dd9f5316ae73b65897c432cb226d6d7e979))

## [0.49.3](https://github.com/andr-235/parseVK/compare/v0.49.2...v0.49.3) (2026-06-26)


### Bug Fixes

* **moderation-service:** pass Python list to JSONB contains instead of string ([996543d](https://github.com/andr-235/parseVK/commit/996543d1d7f80fd38d86aab9b1eb18d77837c9ca))

## [0.49.2](https://github.com/andr-235/parseVK/compare/v0.49.1...v0.49.2) (2026-06-26)


### Bug Fixes

* **moderation-service:** fix JSONB scopes filter - use contains instead of any ([62da03d](https://github.com/andr-235/parseVK/commit/62da03d0db9c5f02bdf46290fb034e9fc6cc3adb))

## [0.49.1](https://github.com/andr-235/parseVK/compare/v0.49.0...v0.49.1) (2026-06-26)


### Bug Fixes

* **api-gateway,moderation-service:** increase keywords limit to 1000 ([264e18b](https://github.com/andr-235/parseVK/commit/264e18ba55536ec810bca3954cb7eb6521121752))

# [0.49.0](https://github.com/andr-235/parseVK/compare/v0.48.1...v0.49.0) (2026-06-26)


### Features

* **im-service:** replace local keywords with moderation-service keywords ([3d17b01](https://github.com/andr-235/parseVK/commit/3d17b01a4d534d9998c1164e3159deb0133ee5a1))

## [0.48.1](https://github.com/andr-235/parseVK/compare/v0.48.0...v0.48.1) (2026-06-26)


### Bug Fixes

* **monitoring:** type mismatch in handleSaveGroup callback ([7816ef5](https://github.com/andr-235/parseVK/commit/7816ef53c041f1a88b7b8f42571a712e6a2d66d2))

# [0.48.0](https://github.com/andr-235/parseVK/compare/v0.47.0...v0.48.0) (2026-06-26)


### Features

* **monitoring:** switch monitoring page data source to im-service ([67347d1](https://github.com/andr-235/parseVK/commit/67347d1461cf708d3116c677365e5aa97189e098))

# [0.47.0](https://github.com/andr-235/parseVK/compare/v0.46.0...v0.47.0) (2026-06-26)


### Bug Fixes

* **im-service:** prevent Max poller from re-fetching all history ([a408289](https://github.com/andr-235/parseVK/commit/a408289594ea7ca7f84069e35359cc24111fcc9d))


### Features

* **im-service:** add continuous Wappi/Max polling and fix env config ([318c0f5](https://github.com/andr-235/parseVK/commit/318c0f5fc88e2fe3257a9b4759de17e5aa14f00c))

# [0.46.0](https://github.com/andr-235/parseVK/compare/v0.45.7...v0.46.0) (2026-06-26)


### Bug Fixes

* **im-service:** align internal token header with project standard ([99d6750](https://github.com/andr-235/parseVK/commit/99d67502547bfedb3bd8abaeec76c8a216ad7310))


### Features

* **api-gateway:** add IM gateway module ([6530af2](https://github.com/andr-235/parseVK/commit/6530af24badfd492c4b8f54466e8e7c4a8017d5e))
* **im-service:** add keyword and notifier state DB models + GIN index ([f6791dd](https://github.com/andr-235/parseVK/commit/f6791dd0d19343508316456cc3264f1b9416eb21))
* **im-service:** add keywords module ([7b31ac4](https://github.com/andr-235/parseVK/commit/7b31ac454fa898de0e061e5117c9f6170e5071e2))
* **im-service:** add message notifier module ([5a11340](https://github.com/andr-235/parseVK/commit/5a11340fb5788eabe903ffe9e2125c548eb6969d))
* **im-service:** add search module ([97fc408](https://github.com/andr-235/parseVK/commit/97fc4083b5cd79dfa8cdbca80f9c8613e0cade2a))
* **im-service:** wire up routers and notifier ([863a369](https://github.com/andr-235/parseVK/commit/863a369f603aaaeba6fe8eae44d474a27be7d746))

## [0.45.7](https://github.com/andr-235/parseVK/compare/v0.45.6...v0.45.7) (2026-06-25)


### Bug Fixes

* use heads for telegram-migrate due to multiple heads ([62bea22](https://github.com/andr-235/parseVK/commit/62bea2260c3d1bd11a777d471e1f8e3bb03a660f))

## [0.45.6](https://github.com/andr-235/parseVK/compare/v0.45.5...v0.45.6) (2026-06-25)


### Bug Fixes

* add alembic dependency to telegram-service ([60c9da3](https://github.com/andr-235/parseVK/commit/60c9da3c7010e0a10e4014e54e808f2c115f5189))

## [0.45.5](https://github.com/andr-235/parseVK/compare/v0.45.4...v0.45.5) (2026-06-25)


### Bug Fixes

* set UV_CACHE_DIR for migrate containers ([8bcd5b2](https://github.com/andr-235/parseVK/commit/8bcd5b2172e760ca321a8fe19286c678ffa5c65d))

## [0.45.4](https://github.com/andr-235/parseVK/compare/v0.45.3...v0.45.4) (2026-06-25)


### Bug Fixes

* set UV_CACHE_DIR for migrate containers to prevent cache permission error ([7b09682](https://github.com/andr-235/parseVK/commit/7b09682fc709e33d1e414b5ca73374b5652d7ca9))

## [0.45.3](https://github.com/andr-235/parseVK/compare/v0.45.2...v0.45.3) (2026-06-25)


### Bug Fixes

* use uv run alembic in migrate containers to avoid PATH issues ([c2c7b0c](https://github.com/andr-235/parseVK/commit/c2c7b0cc692019978dc3baa724b5460cbe2cd1bf))

## [0.45.2](https://github.com/andr-235/parseVK/compare/v0.45.1...v0.45.2) (2026-06-25)


### Bug Fixes

* **kafka:** pause partition on consumer failure to prevent offset loss ([55c2395](https://github.com/andr-235/parseVK/commit/55c239539bf1e71384e4e9b97bc85db0d5b123fc))

## [0.45.1](https://github.com/andr-235/parseVK/compare/v0.45.0...v0.45.1) (2026-06-24)


### Bug Fixes

* **vk-service:** handle task.automation_run_requested event type ([6a621bb](https://github.com/andr-235/parseVK/commit/6a621bb5da63520eef6aae5d95dcfc135b3ad597))

# [0.45.0](https://github.com/andr-235/parseVK/compare/v0.44.3...v0.45.0) (2026-06-24)


### Features

* **tasks-service:** add background automation scheduler loop with config and health ([83b7996](https://github.com/andr-235/parseVK/commit/83b7996c8918af505ab71f9e71c49a5bae5c6c00)), closes [#155](https://github.com/andr-235/parseVK/issues/155)

## [0.44.3](https://github.com/andr-235/parseVK/compare/v0.44.2...v0.44.3) (2026-06-23)


### Bug Fixes

* **admin-users:** harden user management workflow ([61e9027](https://github.com/andr-235/parseVK/commit/61e90276dac0c9b422a820c64d10f880e9fbff3b)), closes [#270](https://github.com/andr-235/parseVK/issues/270)

## [0.44.2](https://github.com/andr-235/parseVK/compare/v0.44.1...v0.44.2) (2026-06-23)


### Bug Fixes

* **content-service:** add missing UUID import in processor ([2c0c838](https://github.com/andr-235/parseVK/commit/2c0c838965075a9fd42b4ee927f03f0739a7ebab))

## [0.44.1](https://github.com/andr-235/parseVK/compare/v0.44.0...v0.44.1) (2026-06-23)


### Bug Fixes

* **content-service:** add missing UUID import ([ed9424e](https://github.com/andr-235/parseVK/commit/ed9424ef11fadb5e3213b7c73a0e71a046a4e022))

# [0.44.0](https://github.com/andr-235/parseVK/compare/v0.43.0...v0.44.0) (2026-06-23)


### Features

* complete EDA compliance — tracing, dedupe, integration tests ([5097141](https://github.com/andr-235/parseVK/commit/50971413d3c1200a2707f4f32f235358efbcb639))
* **telegram-service:** add FastAPI microservice with Telethon integration ([14630aa](https://github.com/andr-235/parseVK/commit/14630aae053a2e30a405ee5609d685da98769c36))

# [0.43.0](https://github.com/andr-235/parseVK/compare/v0.42.1...v0.43.0) (2026-06-22)


### Features

* **api-gateway:** add status proxy and post_url to response ([e82677b](https://github.com/andr-235/parseVK/commit/e82677b86f4fecdda46f42ef50b1b298fe45a013))
* **frontend:** wire status persistence and postUrl link ([2e0ebed](https://github.com/andr-235/parseVK/commit/2e0ebed965ea2c39fb4fe2d51b04ad5d4119f636))
* **moderation-service:** add status column and PATCH endpoint ([a101668](https://github.com/andr-235/parseVK/commit/a10166896e439e432b99c667abda378ffe1440b1))

## [0.42.1](https://github.com/andr-235/parseVK/compare/v0.42.0...v0.42.1) (2026-06-22)


### Bug Fixes

* **front:** truncate long comment text with ellipsis instead of wrapping ([6644c16](https://github.com/andr-235/parseVK/commit/6644c16da7cf63ad1bc3670d66c218d80f3af6a7))

# [0.42.0](https://github.com/andr-235/parseVK/compare/v0.41.2...v0.42.0) (2026-06-22)


### Features

* **moderation-service:** trigger keyword recalculation on vk.task_completed ([61ee7c8](https://github.com/andr-235/parseVK/commit/61ee7c88a52d9bd9e70782e95eca5f7ed030f1f7))

## [0.41.2](https://github.com/andr-235/parseVK/compare/v0.41.1...v0.41.2) (2026-06-22)


### Bug Fixes

* **front:** improve highlight contrast and restore text column width ([2d9c985](https://github.com/andr-235/parseVK/commit/2d9c9859d4b19d9ef4b40d836337aa5e57f3bdf0))

## [0.41.1](https://github.com/andr-235/parseVK/compare/v0.41.0...v0.41.1) (2026-06-22)


### Bug Fixes

* **moderation-service:** return actual matched text fragments instead of keyword base forms ([0845add](https://github.com/andr-235/parseVK/commit/0845add0958a8ed1f7e3351d3f6d8fb49ac7b263))

# [0.41.0](https://github.com/andr-235/parseVK/compare/v0.40.5...v0.41.0) (2026-06-22)


### Features

* filter comments with empty matched_keywords and highlight keywords ([faedd04](https://github.com/andr-235/parseVK/commit/faedd047c710aba58b12297bf6282c1def55ee86))

## [0.40.5](https://github.com/andr-235/parseVK/compare/v0.40.4...v0.40.5) (2026-06-22)


### Bug Fixes

* **vk-service:** handle 404 from tasks-service start_execution ([7c4614d](https://github.com/andr-235/parseVK/commit/7c4614dc0c142b01937f662c5511a24c9e288bfb))

## [0.40.4](https://github.com/andr-235/parseVK/compare/v0.40.3...v0.40.4) (2026-06-22)


### Bug Fixes

* **vk-service:** handle task.cancelled and task.failed events in Kafka consumer ([8909c8d](https://github.com/andr-235/parseVK/commit/8909c8dc8d5ad2eb96d091c5b13476281864b42c)), closes [#issue](https://github.com/andr-235/parseVK/issues/issue)

## [0.40.3](https://github.com/andr-235/parseVK/compare/v0.40.2...v0.40.3) (2026-06-22)


### Bug Fixes

* moderated comment page ([91d2948](https://github.com/andr-235/parseVK/commit/91d29481cc1ca3768cf4aa0f802a8c1461a40e07))

## [0.40.2](https://github.com/andr-235/parseVK/compare/v0.40.1...v0.40.2) (2026-06-22)


### Bug Fixes

* **moderation-service:** match raw vk comments by keywords ([48841a3](https://github.com/andr-235/parseVK/commit/48841a36b35d4fe07160685c479c3df75c44b916))

## [0.40.1](https://github.com/andr-235/parseVK/compare/v0.40.0...v0.40.1) (2026-06-22)


### Bug Fixes

* **vk-service:** map unknown VK API errors to domain error instead of auth ([7efe22f](https://github.com/andr-235/parseVK/commit/7efe22f5dacaa1b496c67e99f2ba1c991339e5c5))

# [0.40.0](https://github.com/andr-235/parseVK/compare/v0.39.4...v0.40.0) (2026-06-22)


### Features

* **vk-service:** add VK token diagnostics for startup and health check ([abff535](https://github.com/andr-235/parseVK/commit/abff535c38ec9cf3bf76b69091986279a525eb3d))

## [0.39.4](https://github.com/andr-235/parseVK/compare/v0.39.3...v0.39.4) (2026-06-21)


### Bug Fixes

* **vk-service:** add structured VK API error code handling ([7b277a9](https://github.com/andr-235/parseVK/commit/7b277a92c2fb7f431a84c21ce734857f23b4e567))

## [0.39.3](https://github.com/andr-235/parseVK/compare/v0.39.2...v0.39.3) (2026-06-21)


### Bug Fixes

* **vk-service,tasks-service:** add crash recovery for background asyncio tasks ([d2a8826](https://github.com/andr-235/parseVK/commit/d2a8826ca49686b9a0650bcc35ce0c65af31e5d7))

## [0.39.2](https://github.com/andr-235/parseVK/compare/v0.39.1...v0.39.2) (2026-06-21)


### Bug Fixes

* **tasks:** reset stale id sequences to fix duplicate key errors ([a0d63b6](https://github.com/andr-235/parseVK/commit/a0d63b663c3fbbd08c5e7b6d6a80fd473fca4684))

## [0.39.1](https://github.com/andr-235/parseVK/compare/v0.39.0...v0.39.1) (2026-06-21)


### Bug Fixes

* **tasks:** add missing cancel endpoint and global exception handler ([07747f0](https://github.com/andr-235/parseVK/commit/07747f0f67d20f94f67eba87e65c78f90f3be464))

# [0.39.0](https://github.com/andr-235/parseVK/compare/v0.38.0...v0.39.0) (2026-06-19)


### Features

* **vk-service:** define abstract repository interfaces in domain/repositories ([461178c](https://github.com/andr-235/parseVK/commit/461178c87413e45157ffefc3116e0f0098315b3a))
* **vk-service:** implement composition root, dependencies and presentation routers ([57a255f](https://github.com/andr-235/parseVK/commit/57a255f5b06d23bd466a71ae45b23ec450215646))
* **vk-service:** implement concrete repositories and relocate third-party clients ([451a00d](https://github.com/andr-235/parseVK/commit/451a00da4525ebcd197edefbdd8c68503a937867))
* **vk-service:** relocate and adapt use case logic to Services ([93d9f7d](https://github.com/andr-235/parseVK/commit/93d9f7dffcd5dd919a74527173da00f50b3267df))
* **vk-service:** relocate background tasks and workers to app/tasks ([56f6ea9](https://github.com/andr-235/parseVK/commit/56f6ea91719825af53eb3e8c9b9f933de2adc02f))
* **vk-service:** update main entrypoint and adapt test suites for layered architecture ([52f9a85](https://github.com/andr-235/parseVK/commit/52f9a857c8782c1d35ac8a31c250f9bde26b3cac))

# [0.38.0](https://github.com/andr-235/parseVK/compare/v0.37.8...v0.38.0) (2026-06-19)


### Features

* **api-gateway:** add IdentityClientMethods with typed auth endpoints ([bdf68e0](https://github.com/andr-235/parseVK/commit/bdf68e0594b2e53422cc4b87abb9c346d75233a3))

## [0.37.8](https://github.com/andr-235/parseVK/compare/v0.37.7...v0.37.8) (2026-06-19)


### Bug Fixes

* **front:** add 401 refresh token flow and migrate_data script ([9472636](https://github.com/andr-235/parseVK/commit/94726361b7b1435cb378640d05f122d1bc104699))

## [0.37.7](https://github.com/andr-235/parseVK/compare/v0.37.6...v0.37.7) (2026-06-19)


### Bug Fixes

* **front:** add 401 refresh token flow to prevent tasks page hang on expired JWT ([1aac558](https://github.com/andr-235/parseVK/commit/1aac558b43715d9ac3194d648174bb29f9c92431))

## [0.37.6](https://github.com/andr-235/parseVK/compare/v0.37.5...v0.37.6) (2026-06-19)


### Bug Fixes

* **vk-service:** pass fields parameter to get_groups in DataCollector ([8663580](https://github.com/andr-235/parseVK/commit/8663580ac27b1333588d120ec8cba206cbe7882d))

## [0.37.5](https://github.com/andr-235/parseVK/compare/v0.37.4...v0.37.5) (2026-06-19)


### Bug Fixes

* **moderation-service:** replace heuristic pagination total with real COUNT(*) ([5a388ad](https://github.com/andr-235/parseVK/commit/5a388ad905680dca84f4eb72525197697e9afdc2))

## [0.37.4](https://github.com/andr-235/parseVK/compare/v0.37.3...v0.37.4) (2026-06-19)


### Bug Fixes

* **front:** rename backend types to DTO with snake_case fields and add null guards ([067c3f2](https://github.com/andr-235/parseVK/commit/067c3f2d70e9e474af4d19b754106a255f509dd4))

## [0.37.3](https://github.com/andr-235/parseVK/compare/v0.37.2...v0.37.3) (2026-06-19)


### Bug Fixes

* **api-gateway:** add missing keyword_source param to CommentsGatewayService ([69cac35](https://github.com/andr-235/parseVK/commit/69cac35f18aa3c13f50988a385936918e46a9714))

## [0.37.2](https://github.com/andr-235/parseVK/compare/v0.37.1...v0.37.2) (2026-06-18)


### Bug Fixes

* **api-gateway:** fix content-service enrichment paths in comments ([de348ba](https://github.com/andr-235/parseVK/commit/de348ba1226cf6a32c6c23bbaa5caf9222489210))

## [0.37.1](https://github.com/andr-235/parseVK/compare/v0.37.0...v0.37.1) (2026-06-18)


### Bug Fixes

* **comments:** use authorVkId instead of ownerId for author fallback ([3c9aa76](https://github.com/andr-235/parseVK/commit/3c9aa76e13ea9f5e5266903ae2ed95ebf68dacfa))

# [0.37.0](https://github.com/andr-235/parseVK/compare/v0.36.0...v0.37.0) (2026-06-18)


### Features

* **comments:** add avatars and screen names to comments table ([7ca33b5](https://github.com/andr-235/parseVK/commit/7ca33b5eb34b4e0557c6fc571f4ff0f5c2b09018))

# [0.36.0](https://github.com/andr-235/parseVK/compare/v0.35.8...v0.36.0) (2026-06-18)


### Features

* **api-gateway:** enrich comments with author and group profiles ([353328d](https://github.com/andr-235/parseVK/commit/353328d12d5002738b674a9a6fba6be1b56bbdc3))

## [0.35.8](https://github.com/andr-235/parseVK/compare/v0.35.7...v0.35.8) (2026-06-18)


### Bug Fixes

* **docker:** remove VITE_API_URL ARG/ENV from frontend build ([ffacc14](https://github.com/andr-235/parseVK/commit/ffacc1423bb391f66457880fe1c34167ed42916b))

## [0.35.7](https://github.com/andr-235/parseVK/compare/v0.35.6...v0.35.7) (2026-06-18)


### Bug Fixes

* **scripts:** include source columns in SELECT for computed external_key ([58db5c4](https://github.com/andr-235/parseVK/commit/58db5c4ed80e797feb715909676ab7fa4044f09b))

## [0.35.6](https://github.com/andr-235/parseVK/compare/v0.35.5...v0.35.6) (2026-06-18)


### Bug Fixes

* **api-gateway:** map moderation comment fields for frontend compatibility ([aca4327](https://github.com/andr-235/parseVK/commit/aca4327cada73c792946637fc6de0a4475f091da))

## [0.35.5](https://github.com/andr-235/parseVK/compare/v0.35.4...v0.35.5) (2026-06-18)


### Bug Fixes

* **deploy:** expose frontend on 0.0.0.0 for external access ([dbb4740](https://github.com/andr-235/parseVK/commit/dbb4740e5732f62778f9b965951d3217a922908e))

## [0.35.4](https://github.com/andr-235/parseVK/compare/v0.35.3...v0.35.4) (2026-06-18)


### Bug Fixes

* **scripts:** add Comment mapping for moderation-service migration ([89fef9a](https://github.com/andr-235/parseVK/commit/89fef9a7e727d4cf8734ddd064c78cfc62790908))

## [0.35.3](https://github.com/andr-235/parseVK/compare/v0.35.2...v0.35.3) (2026-06-18)


### Bug Fixes

* **api-gateway:** enrich watchlist authors with profiles from content-service ([8d9ea90](https://github.com/andr-235/parseVK/commit/8d9ea90acdc67e2b4a4d846cd797108562cb2cd5))
* **api-gateway:** return keywords key instead of items in list response ([7fc99c6](https://github.com/andr-235/parseVK/commit/7fc99c6150696a1d0b9586abf0c38d9a0e28df13))
* **content-service:** replace pydantic v1 from_attributes with model_validate ([5a9904b](https://github.com/andr-235/parseVK/commit/5a9904bd54378b2a55f089f9447ed93f6003eb5f))

## [0.35.2](https://github.com/andr-235/parseVK/compare/v0.35.1...v0.35.2) (2026-06-18)


### Bug Fixes

* **docker:** move useradd before COPY and remove --no-install-project in all service Dockerfiles ([9aefc24](https://github.com/andr-235/parseVK/commit/9aefc24a8d0665f5517eb57c965324488917b4e3))

## [0.35.1](https://github.com/andr-235/parseVK/compare/v0.35.0...v0.35.1) (2026-06-18)


### Bug Fixes

* **deploy:** add /api/ catch-all to nginx and align VITE_API_URL ([b650364](https://github.com/andr-235/parseVK/commit/b6503645da7c6e7c303f7e4c6ea935825c2bb3a9))
* **deploy:** use docker-compose.yml instead of docker-compose.deploy.yml ([a60781b](https://github.com/andr-235/parseVK/commit/a60781b0b5db38949d871ca3e9d92f52bae863cb))
* **docker:** add missing chown paths for nginx conf.d and /run in frontend Dockerfile ([e22a3d9](https://github.com/andr-235/parseVK/commit/e22a3d9d3d38e63bf923d9eb4d10f48946fd6e8f))
* **front:** remove non-existent react-hooks rule, fix any type, ignore coverage dirs in eslint ([5a398d2](https://github.com/andr-235/parseVK/commit/5a398d21339e42aafc415ae8251c3a2a0353159a))

<<<<<<< HEAD
## [0.32.2](https://github.com/andr-235/parseVK/compare/v0.32.1...v0.32.2) (2026-06-15)
=======
# [0.35.0](https://github.com/andr-235/parseVK/compare/v0.34.0...v0.35.0) (2026-06-17)
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


### Bug Fixes

<<<<<<< HEAD
* **deploy:** comment out unimplemented im-service from compose ([bacfa5b](https://github.com/andr-235/parseVK/commit/bacfa5b8ad19650f83f0fff97499563fa4aca33d))

## [0.32.1](https://github.com/andr-235/parseVK/compare/v0.32.0...v0.32.1) (2026-06-15)


### Bug Fixes

* **deploy:** handle missing local images gracefully ([bc325d2](https://github.com/andr-235/parseVK/commit/bc325d241878024d2d39f7c63ccc55a7c4a39e64))
* **deploy:** switch to docker-compose.yml ([c7eade4](https://github.com/andr-235/parseVK/commit/c7eade48f648d400b528e19ff17d422c44363b29))

# [0.32.0](https://github.com/andr-235/parseVK/compare/v0.31.4...v0.32.0) (2026-06-15)
=======
* **patch-cursor:** update timestamp for last processed patch ([74b1b89](https://github.com/andr-235/parseVK/commit/74b1b8938896ba2cd90d8a3c90d0e171e5dc9dc3))
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da


### Features

<<<<<<< HEAD
* merge fastapi-microservices-rewrite into main ([#256](https://github.com/andr-235/parseVK/issues/256)) ([e24c5de](https://github.com/andr-235/parseVK/commit/e24c5de065a5438f09f6b5af4e63f249b5110a23)), closes [#73](https://github.com/andr-235/parseVK/issues/73) [#86](https://github.com/andr-235/parseVK/issues/86) [#79](https://github.com/andr-235/parseVK/issues/79) [#92](https://github.com/andr-235/parseVK/issues/92) [#77](https://github.com/andr-235/parseVK/issues/77) [#77](https://github.com/andr-235/parseVK/issues/77) [#76](https://github.com/andr-235/parseVK/issues/76) [#76](https://github.com/andr-235/parseVK/issues/76)
=======
* **plans:** add detailed plans for extracting useTasksMutations hook, cleaning up old monolith legacy, fixing deployment container build failures, and refactoring content service ([9ddd6b7](https://github.com/andr-235/parseVK/commit/9ddd6b7bb14b2573e805690d1c0c4ba68cc6e218))

# [0.34.0](https://github.com/andr-235/parseVK/compare/v0.33.12...v0.34.0) (2026-06-17)


### Bug Fixes

* **ci:** exclude .agents from ruff check ([7fb7035](https://github.com/andr-235/parseVK/commit/7fb7035a4657321086b8afcb3f7c7c401eee88a5))
* **ci:** install pytest as dev dependency for libs/py/common tests ([e7bbd7a](https://github.com/andr-235/parseVK/commit/e7bbd7a8da94552da75d57144782ee3bfdffdbf2))
* **ci:** ruff pass on api-gateway + libs, fix 3 pre-existing issues ([6cd9352](https://github.com/andr-235/parseVK/commit/6cd9352d585f4bf6c2d8f035a1262a3836a40893))


### Features

* **docker:** add non-root user and HEALTHCHECK to all python service images ([c08cc89](https://github.com/andr-235/parseVK/commit/c08cc89ed934c97ce027214785eeb03d1594793c))

## [0.33.12](https://github.com/andr-235/parseVK/compare/v0.33.11...v0.33.12) (2026-06-17)


### Bug Fixes

* **api-gateway:** remove unused IdentityClientError import ([74bd3a0](https://github.com/andr-235/parseVK/commit/74bd3a09033de72c3285b53f11a58403574cce53))

## [0.33.11](https://github.com/andr-235/parseVK/compare/v0.33.10...v0.33.11) (2026-06-17)


### Bug Fixes

* **identity-db:** change host port to 54325 ([cc575ab](https://github.com/andr-235/parseVK/commit/cc575abd6e12606c2de70cbff22df66ae5da9370))

## [0.33.10](https://github.com/andr-235/parseVK/compare/v0.33.9...v0.33.10) (2026-06-17)


### Bug Fixes

* **identity-db:** change host port from 5434 to 5436 ([68db1d2](https://github.com/andr-235/parseVK/commit/68db1d288bada15c268130b94d3e89c9ba256fd8))

## [0.33.9](https://github.com/andr-235/parseVK/compare/v0.33.8...v0.33.9) (2026-06-17)


### Bug Fixes

* **deploy:** stop all containers before deploy to release ports ([d5b7ab0](https://github.com/andr-235/parseVK/commit/d5b7ab0413a8639185d84b6bc420a98d7236513b))

## [0.33.8](https://github.com/andr-235/parseVK/compare/v0.33.7...v0.33.8) (2026-06-17)


### Bug Fixes

* **identity-service:** make initial migration idempotent with IF NOT EXISTS ([2861d0b](https://github.com/andr-235/parseVK/commit/2861d0bb24fd4a33ef3483978ae23b7c21e284a5))

## [0.33.7](https://github.com/andr-235/parseVK/compare/v0.33.6...v0.33.7) (2026-06-17)


### Bug Fixes

* **deploy:** add --remove-orphans to compose up to prevent port conflicts ([d7203b7](https://github.com/andr-235/parseVK/commit/d7203b736f4b0c8de68a93fb41329dd875f4e6fc))

## [0.33.6](https://github.com/andr-235/parseVK/compare/v0.33.5...v0.33.6) (2026-06-17)


### Bug Fixes

* **deploy:** remove db_backup legacy references from deploy scripts ([8c84723](https://github.com/andr-235/parseVK/commit/8c84723ffd575ef0a5b2675053cc51bb3944cebf)), closes [#271](https://github.com/andr-235/parseVK/issues/271)

## [0.33.5](https://github.com/andr-235/parseVK/compare/v0.33.4...v0.33.5) (2026-06-17)


### Bug Fixes

* **deploy:** resolve container startup failures from volume, migration, and config issues ([febdd21](https://github.com/andr-235/parseVK/commit/febdd218807d5172e0800d309ded3fde2a40738b))

## [0.33.4](https://github.com/andr-235/parseVK/compare/v0.33.3...v0.33.4) (2026-06-17)


### Bug Fixes

* **deploy:** add missing services to change detection, fix volume and dockerignore ([28a28b1](https://github.com/andr-235/parseVK/commit/28a28b12dd5503ad36b59e85392da3140611a2ac))
* **deploy:** add PyPI preflight check and unify base image tag ([801e2e5](https://github.com/andr-235/parseVK/commit/801e2e5b4beb0187e9ae236e2d45efdce158de22))

## [0.33.3](https://github.com/andr-235/parseVK/compare/v0.33.2...v0.33.3) (2026-06-17)


### Bug Fixes

* **docker:** replace ghcr.io uv copy with pip install ([7dda8fe](https://github.com/andr-235/parseVK/commit/7dda8fe207ee08be3749bb5735ae737e1124c0a4))

## [0.33.2](https://github.com/andr-235/parseVK/compare/v0.33.1...v0.33.2) (2026-06-17)


### Bug Fixes

* **deploy:** add im-service files and build pipeline ([ca7269f](https://github.com/andr-235/parseVK/commit/ca7269fb0ddb4cab8b9400f57b3b0d743e9eb172))

## [0.33.1](https://github.com/andr-235/parseVK/compare/v0.33.0...v0.33.1) (2026-06-17)


### Bug Fixes

* **deploy:** wrap resources in deploy key in docker-compose.yml ([9df1b5a](https://github.com/andr-235/parseVK/commit/9df1b5ad2eb6abf404af703f022f58e8be7292ab))
* **docs:** update default branch reference from 'fastapi-microservices-rewrite' to 'main' in AGENTS.md ([3e4b4c2](https://github.com/andr-235/parseVK/commit/3e4b4c28b2637ed2ac8d3353b8b3d16abe3c2dcd))

# [0.33.0](https://github.com/andr-235/parseVK/compare/v0.32.2...v0.33.0) (2026-06-17)


### Bug Fixes

* **ci:** fix all ruff lint errors across all services ([1b19406](https://github.com/andr-235/parseVK/commit/1b194063634c779148ed0dabc5d568df7892fbe1))
* **content-service:** add Service Layer and fix test cross-contamination ([b073240](https://github.com/andr-235/parseVK/commit/b0732408292fdd71fe1f7be3ffc7aba8acfc5fac))
* **docker-compose:** update Redis command and healthcheck; remove unused api service ([70e238c](https://github.com/andr-235/parseVK/commit/70e238c59b5fb0220bfe6f2bc9af28b014d43295))
* **docker:** remove external buildkit syntax directives ([5d40a6d](https://github.com/andr-235/parseVK/commit/5d40a6d5e3c1c87113bd534599460b5e7f4250a9))
* **docker:** restore deploy compose startup ([#183](https://github.com/andr-235/parseVK/issues/183)) ([576f0b7](https://github.com/andr-235/parseVK/commit/576f0b7c65274d6870bb2bde3c1b54c688f4c38e)), closes [#182](https://github.com/andr-235/parseVK/issues/182)
* **frontend:** preserve host port on redirects and disable tasks websocket progress ([46f6647](https://github.com/andr-235/parseVK/commit/46f66479bce2d85869b1056c3760b2fda8f19626))
* **frontend:** route content-service api requests to gateway in nginx ([5c2e48d](https://github.com/andr-235/parseVK/commit/5c2e48d0a31cb431502cf7ea423d6f5a9a3184c8))
* **frontend:** update Nginx config and proxy routing to point to api-gateway ([0ca7baf](https://github.com/andr-235/parseVK/commit/0ca7bafe249e8503d690275ecae5f600c474ffe5))
* **front:** restore TelegramPage and revert dl-upload page ([5f8d7cb](https://github.com/andr-235/parseVK/commit/5f8d7cbf22082112a1225a7f2a2df3a55bf38eef))
* **GroupCard:** adjust styling for description and button container ([5e9dcb7](https://github.com/andr-235/parseVK/commit/5e9dcb79bea95f33de5c764c35b88a8f2a1b8b82))
* **GroupCard:** update delete logic to use vkId instead of id ([907e744](https://github.com/andr-235/parseVK/commit/907e7448bc4867676a1d1b1a4941754126885adb))
* **groups:** prevent infinite API request loop on fetch error ([9804857](https://github.com/andr-235/parseVK/commit/9804857c9658a2c6a4cb8c85f12cb1f064ea1dd4))
* **identity-service:** add missing import of settings in auth router ([3c4ac39](https://github.com/andr-235/parseVK/commit/3c4ac39f00e354135a5f60efdbed41e30ca1e18b))
* **parsevkctl:** gate task merge locally ([#202](https://github.com/andr-235/parseVK/issues/202)) ([7763476](https://github.com/andr-235/parseVK/commit/77634760e3549c99b33731b32e70c3d0721f1efc)), closes [#201](https://github.com/andr-235/parseVK/issues/201)
* **parsevkctl:** make merged task branch cleanup idempotent ([#226](https://github.com/andr-235/parseVK/issues/226)) ([4758a49](https://github.com/andr-235/parseVK/commit/4758a49abb4f14a3a76afd3a2ef5a664967a65a6)), closes [#225](https://github.com/andr-235/parseVK/issues/225) [#225](https://github.com/andr-235/parseVK/issues/225)
* resolve all service architecture violations across 6 services ([1a840ce](https://github.com/andr-235/parseVK/commit/1a840ce69e8350c42f6c9c93fd1e320e6af4f209))
* **services:** add missing stub modules to resolve ModuleNotFoundError in tests ([35012cf](https://github.com/andr-235/parseVK/commit/35012cf7286e08272d5898954fa610ee04eb444e)), closes [#257](https://github.com/andr-235/parseVK/issues/257)
* **sidebar:** исправление TS ошибки с email в SidebarFooter ([2c3c1a9](https://github.com/andr-235/parseVK/commit/2c3c1a988d93160a3d8e24c389c599cfa786da63))
* **skills:** update page structure and component guidelines in documentation ([5e74322](https://github.com/andr-235/parseVK/commit/5e743221af2919e1c5fefd5825be6f78178c57f4))
* **telegram-dl-upload:** pass query params with explicit cast to Record ([5de665a](https://github.com/andr-235/parseVK/commit/5de665a4956b759c5a397ef789da7ad75c6cf7b4))
* **telegram-dl-upload:** remove unused API_URL import ([b3ff604](https://github.com/andr-235/parseVK/commit/b3ff604c17d843ad98a9512dbf98940b9f0cde31))
* **telegram-service:** fix ruff lint errors - add noqa for mock code, fix B904/F841/F401/E501 ([bdc6fd9](https://github.com/andr-235/parseVK/commit/bdc6fd9c215a54429571c16107863be40956a282))
* use .get() for owner_id in outbox and moderation services ([9d1b7fc](https://github.com/andr-235/parseVK/commit/9d1b7fcb256a7c2f2d42a0a6a3192c4965271df7))
* **vk_api:** enhance get_groups method to include optional fields and improve error handling in save_single_group ([8f009f4](https://github.com/andr-235/parseVK/commit/8f009f4336160480ff2416175136765fd0dc6c0a))
* **vk-service:** make vk_token validator respect use_fake_vk_adapter flag ([485918e](https://github.com/andr-235/parseVK/commit/485918e035888a251ad63529a846886eff247256))
* **vk-service:** reorder routes to fix /groups/all matching ([deca2ef](https://github.com/andr-235/parseVK/commit/deca2ef6adc4383c1bdc4e4174dd178ae285cc78))
* добавлен cleanup после создания PR ([#70](https://github.com/andr-235/parseVK/issues/70)) ([#71](https://github.com/andr-235/parseVK/issues/71)) ([88463da](https://github.com/andr-235/parseVK/commit/88463dad8ba624f0f4918f4f0bfd68d3d57dbc4a))
* добавлено автоматическое формирование Conventional Commit при слиянии PR ([#76](https://github.com/andr-235/parseVK/issues/76)) ([3b7065c](https://github.com/andr-235/parseVK/commit/3b7065c7d89858614a5cef545382067f82ec54af))
* закрыты gaps миграции parsevkctl go ([#126](https://github.com/andr-235/parseVK/issues/126)) ([#128](https://github.com/andr-235/parseVK/issues/128)) ([08773d5](https://github.com/andr-235/parseVK/commit/08773d5100f445451dc2b281911a1aabae7e6c63))
* исправлен esm импорт tgmbase prisma ([86b4b86](https://github.com/andr-235/parseVK/commit/86b4b86cc94e8476edc3d7c3fa040bdf108bbc8e))
* исправлен smoke запуск fastapi auth ([6d9ccb4](https://github.com/andr-235/parseVK/commit/6d9ccb4868840b7f012ee74bb758b44ab5a2b2d4))
* исправлена ошибка парсинга переменной с двоеточием в parsevkctl.ps1 ([#77](https://github.com/andr-235/parseVK/issues/77)) ([d6507db](https://github.com/andr-235/parseVK/commit/d6507dbbe00ba58e8d98981834c1c7e8ee469985))
* исправлено ожидание project item в parsevkctl ([#68](https://github.com/andr-235/parseVK/issues/68)) ([#69](https://github.com/andr-235/parseVK/issues/69)) ([0a52408](https://github.com/andr-235/parseVK/commit/0a52408f40b5911fff1d6af95e2ab98158f625e0))
* подключена библиотека vk_api в vk service ([19b904a](https://github.com/andr-235/parseVK/commit/19b904a6e26a9b0b9d637721d91b4c379275a436))
* принудительно установлена UTF-8 кодировка для консоли в parsevkctl ([#78](https://github.com/andr-235/parseVK/issues/78)) ([#84](https://github.com/andr-235/parseVK/issues/84)) ([de595b3](https://github.com/andr-235/parseVK/commit/de595b380960a7c58fc4b7db0fcc65ec89c1a9e5))


### Features

* **a11y:** add focus trap and dialog semantics to TaskDetails ([4922786](https://github.com/andr-235/parseVK/commit/4922786af5af035c905b27abafc3e91f4f42eb40))
* add DataTable component for reusable table functionality ([9370e92](https://github.com/andr-235/parseVK/commit/9370e923e2b11333b242233124f2ac1d43c699ff))
* add project roadmap for tasks page refactor and milestones ([f338254](https://github.com/andr-235/parseVK/commit/f33825407cc0f9eae2cb1f14bb401507023bdcf8))
* add service scaffolding and validation scripts ([801b60a](https://github.com/andr-235/parseVK/commit/801b60a3b7940f34173c2f83d47cde584018d07c))
* add TaskProgressSection and TaskStatsGrid components for task progress visualization ([99c612d](https://github.com/andr-235/parseVK/commit/99c612df6a152cfab3c059df9063481c6e00b860))
* add unit tests for components and pages, implement vitest for testing framework ([89c875c](https://github.com/andr-235/parseVK/commit/89c875cde28b81f97a131a0f109fd7ed3e0c425a))
* **admin-users:** implement admin user management functionality with create, update, delete, and fetch operations ([b841308](https://github.com/andr-235/parseVK/commit/b841308565dd8e2e0a364b47baedcd3e0dfcc545))
* **admin-users:** добавить функционал обновления пользователя и проверку ролей ([7659f36](https://github.com/andr-235/parseVK/commit/7659f367117fccb916e06195c21cf4941df3a4d7))
* **api-gateway,front:** connect Telegram Page UI to real API endpoints via Gateway proxy ([454d499](https://github.com/andr-235/parseVK/commit/454d49964f6736fe68f870660000a6877953c446))
* **api-gateway:** add telegram tgmbase migration slice ([#164](https://github.com/andr-235/parseVK/issues/164)) ([faa89eb](https://github.com/andr-235/parseVK/commit/faa89eba5723ba61a04a73b51c1a32d42cf3437c)), closes [#152](https://github.com/andr-235/parseVK/issues/152)
* **api-gateway:** sync group save to content-service ([bceebc4](https://github.com/andr-235/parseVK/commit/bceebc48899a8a5861354f843520ac6d6f1b5600))
* **api:** refactor API client and configuration ([8894946](https://github.com/andr-235/parseVK/commit/88949460246a1363ed892affb0ca32efc24a648d))
* **api:** добавить функции для работы с комментариями и обработку ошибок API ([b225811](https://github.com/andr-235/parseVK/commit/b2258115eceebff339d11f7e659dee3db30a3fcc))
* **api:** обновить конфигурацию Docker для фронтенда и добавить маршруты API v1 ([e8ebb5b](https://github.com/andr-235/parseVK/commit/e8ebb5b03a295067c14cd5a2e55bae71de786435))
* **app:** add auth outlet and restructure routes ([a823732](https://github.com/andr-235/parseVK/commit/a823732b0024d344b91c639eda7c42cf9fe36c7e))
* **audit:** add frontend technical quality audit for tasks and settings dashboard ([24d1994](https://github.com/andr-235/parseVK/commit/24d19946f8db6d5ea96d91fb169d74cdf88f9a53))
* **auth:** move shared/auth to src/auth ([3ae8fd6](https://github.com/andr-235/parseVK/commit/3ae8fd6854e13f4979ca258dfa3c9db1dfac8e40))
* **authors:** add authors page with components and tests ([c7ae5f8](https://github.com/andr-235/parseVK/commit/c7ae5f8f87f7141bb20006e8a69192ccb0bc5e76))
* **authors:** migrate authors module from nestjs to content and vk services ([cd954bf](https://github.com/andr-235/parseVK/commit/cd954bfd62c8a38dc4671c6d01a5ee2612e5168d))
* **auth:** реализовать функционал аутентификации и смены пароля ([a4b355d](https://github.com/andr-235/parseVK/commit/a4b355dee90be2763981e90d10edbcfec07da525))
* **auth:** редизайн страниц входа и смены пароля под стиль Grapho ([5f64df2](https://github.com/andr-235/parseVK/commit/5f64df27f1529f0873b57ed3085ebd1eff3e6b11))
* **comments,admin-users:** add PageShell wrapper ([68ab7a6](https://github.com/andr-235/parseVK/commit/68ab7a6ba5e2c06b5f4d55883c627c0e41659499))
* **comments:** enhance comment details with group and author links ([5d71439](https://github.com/andr-235/parseVK/commit/5d7143901a5ad433d08f1e9fda07d229b03564e3))
* **comments:** enhance UI and functionality across comment components ([2ff8eb0](https://github.com/andr-235/parseVK/commit/2ff8eb08f14c2113678e2d1090aa8502ac4d7eb0))
* **comments:** migrate moderation API to gateway ([#160](https://github.com/andr-235/parseVK/issues/160)) ([8d68c0b](https://github.com/andr-235/parseVK/commit/8d68c0bdf22c394ecfbff54d35be3da285df74dc)), closes [#147](https://github.com/andr-235/parseVK/issues/147)
* **comments:** refactor comments table and related components ([4aeb64d](https://github.com/andr-235/parseVK/commit/4aeb64d17748a602b785641a092e66a255a61ab1))
* **comments:** добавить компоненты для управления комментариями и их отображения ([9e758bd](https://github.com/andr-235/parseVK/commit/9e758bd9d4e1719c57b4743757b377c84f175deb))
* **comments:** добавить страницу для отображения и управления комментариями ([34c6061](https://github.com/andr-235/parseVK/commit/34c606170d19d7a982309710dfb0dd4c38a260fb))
* **common:** create and integrate PageContainer wrapper for all pages ([4d93fb3](https://github.com/andr-235/parseVK/commit/4d93fb35efd5bb45ab83eed42420369a41288cf1))
* **content-service:** add new fields to ContentGroup model and update repository logic ([5cf7e66](https://github.com/andr-235/parseVK/commit/5cf7e66b8c8b493b362f2609329f197085309457))
* **content-service:** add save group endpoint, fix owner_id in projection, improve consumer resilience ([f3971a8](https://github.com/andr-235/parseVK/commit/f3971a8cb50aa0f4d650905f2f770812b031ff98))
* **content:** migrate authors groups read parity ([#161](https://github.com/andr-235/parseVK/issues/161)) ([95c20ba](https://github.com/andr-235/parseVK/commit/95c20baefa58391c19b94aadafb6bbcb6cade63d)), closes [#148](https://github.com/andr-235/parseVK/issues/148)
* **design:** update product description and visual principles for a cinematic experience ([91347bd](https://github.com/andr-235/parseVK/commit/91347bd07dae6bd4a7f6f94d147810082fbd7801))
* **design:** добавить систему дизайна с цветовой палитрой и типографикой для ParseVK ([e79bffd](https://github.com/andr-235/parseVK/commit/e79bffd665faa4f3680be42d0b965eefe0969c9b))
* **frontend:** add KeywordsPage with CRUD, inline forms, and bulk ops ([05b8a13](https://github.com/andr-235/parseVK/commit/05b8a13699b944948939a4c00dc291974d833619))
* **frontend:** update groups and authors pages, fix Select button type, add dark theme checkbox ([525e591](https://github.com/andr-235/parseVK/commit/525e591476f83406521dfca2565db1c3968b3f1f))
* **front:** migrate hardcoded colors to design tokens, add keyboard shortcuts ([5f99233](https://github.com/andr-235/parseVK/commit/5f992335839f9f956f0c95e4ba98f142f7fdebe0))
* **front:** split telegram dl and live parse into separate pages ([da161fc](https://github.com/andr-235/parseVK/commit/da161fc93f989dc6626e45d7f9ca4293c5ba035f)), closes [#telegram-pages-split](https://github.com/andr-235/parseVK/issues/telegram-pages-split)
* go rewrite: add branch naming package ([#109](https://github.com/andr-235/parseVK/issues/109)) ([690d342](https://github.com/andr-235/parseVK/commit/690d342d43e898b232e3cbc1831a8ad27a3f07bf))
* go rewrite: add Git adapter ([#107](https://github.com/andr-235/parseVK/issues/107)) ([ac827d0](https://github.com/andr-235/parseVK/commit/ac827d063f9410e8c433b1ffc10f3e0bb3f5e79c))
* go rewrite: add GitHub adapter ([#108](https://github.com/andr-235/parseVK/issues/108)) ([e7b27fd](https://github.com/andr-235/parseVK/commit/e7b27fd448e8746c218089602ee6b178e3bd7c4e))
* go rewrite: add planner executor ([#111](https://github.com/andr-235/parseVK/issues/111)) ([42974db](https://github.com/andr-235/parseVK/commit/42974db874dd56910ba723d5b952e755a314a754))
* go rewrite: add read-only task commands ([#112](https://github.com/andr-235/parseVK/issues/112)) ([48edb61](https://github.com/andr-235/parseVK/commit/48edb61543e972f54ccb39ff7e9a95880fd1989f))
* go rewrite: add task lifecycle state machine ([#110](https://github.com/andr-235/parseVK/issues/110)) ([9496c42](https://github.com/andr-235/parseVK/commit/9496c42847cf30992212631129b248a34393b264))
* go rewrite: define parsevkctl domain model ([#106](https://github.com/andr-235/parseVK/issues/106)) ([73377ec](https://github.com/andr-235/parseVK/commit/73377ec19fa622ff1abc1a7062b9aede254f9597))
* go rewrite: implement write commands create, start, pr and merge ([#113](https://github.com/andr-235/parseVK/issues/113)) ([c897a3f](https://github.com/andr-235/parseVK/commit/c897a3f17f444a91dd0359dfb5ce97ac3bd5ac24))
* **groups:** add centralized error state to groupsStore ([4c36ba0](https://github.com/andr-235/parseVK/commit/4c36ba07810ae9eb8165589cd0834e84215379d9))
* **groups:** add region search widget for VK groups ([c4bd475](https://github.com/andr-235/parseVK/commit/c4bd475a3e236edd40bac25f0000667a5d701f8d))
* **groups:** migrate file upload and delete all actions ([66dd420](https://github.com/andr-235/parseVK/commit/66dd420ea40c016edaadd40fd9358fab464eb0f4))
* **groups:** migrate regional search and fix outbox duplicate locks ([3d9d986](https://github.com/andr-235/parseVK/commit/3d9d9861ca5e5ec65b146c15da84b04a65270604))
* **groups:** migrate vk group save logic to fastapi and expose in gateway ([70de31b](https://github.com/andr-235/parseVK/commit/70de31b0412685b62895cb1e9a201be01068c3dc))
* **groups:** support group deletion and regional search in fastapi microservices ([418014e](https://github.com/andr-235/parseVK/commit/418014ec8539d880e5b0dfd7dfa1a82f50870cbe))
* **header:** добавить функционал выхода из системы и улучшить структуру компонента ([742f134](https://github.com/andr-235/parseVK/commit/742f13403c38a945f503fb8ba902286e8ad8cc51))
* implement StatusBadge component for improved status display ([05d6be0](https://github.com/andr-235/parseVK/commit/05d6be09ce162473c8844461e8c701a6495a8f9e))
* implement TasksPage with task management features including create, delete, and automation settings ([b61b72d](https://github.com/andr-235/parseVK/commit/b61b72d45a140a4cbc8671f0882ea4d372e043ed))
* **layout:** добавить компоненты AppLayout, Header и Sidebar для структуры приложения ([9ee6056](https://github.com/andr-235/parseVK/commit/9ee6056723fe3b209173dd237329e0177c4f5f2f))
* **metrics:** redesign service health dashboard and add sidebar navigation ([#229](https://github.com/andr-235/parseVK/issues/229)) ([07500ee](https://github.com/andr-235/parseVK/commit/07500ee3afa2d9083a2a1ad4532d0ea74007af86)), closes [#218](https://github.com/andr-235/parseVK/issues/218)
* **migration:** add liveness and readiness probes to fastapi services ([#200](https://github.com/andr-235/parseVK/issues/200)) ([c19d8b5](https://github.com/andr-235/parseVK/commit/c19d8b5588538b1937879895d763ee1275b1c35a)), closes [#195](https://github.com/andr-235/parseVK/issues/195)
* **moderation:** improve morphology form generation ([b3a91d4](https://github.com/andr-235/parseVK/commit/b3a91d47af290834d536cfd818245a0927b45dca))
* **monitoring:** improve groups hierarchy ([#227](https://github.com/andr-235/parseVK/issues/227)) ([8e2eeac](https://github.com/andr-235/parseVK/commit/8e2eeac6569dcfde67701963923b297add665120)), closes [#216](https://github.com/andr-235/parseVK/issues/216)
* **monitoring:** migrate monitoring module to fastapi content-service ([c0ac39d](https://github.com/andr-235/parseVK/commit/c0ac39d7b1de49381f7a4a96adbc1dbbb430dad6))
* move shared/providers to src/providers, shared/store to src/store ([7c5fe5b](https://github.com/andr-235/parseVK/commit/7c5fe5bb230dc18a9133d3dd70ad21fed97a6675))
* **parsevkctl:** add labels bootstrap command ([#188](https://github.com/andr-235/parseVK/issues/188)) ([6428b25](https://github.com/andr-235/parseVK/commit/6428b25924e90f1f1026f546196a18a6b8efa9a4)), closes [#187](https://github.com/andr-235/parseVK/issues/187)
* **parsevkctl:** add task pr command ([c9d252e](https://github.com/andr-235/parseVK/commit/c9d252efe8ccd9c565fdb71b412c92e8da10db6f))
* **parsevkctl:** add task start command ([6a8bb55](https://github.com/andr-235/parseVK/commit/6a8bb5561d184293010cb4742b78d7dc75f8f3f8))
* **parsevkctl:** implement PR check-status merge guard ([#180](https://github.com/andr-235/parseVK/issues/180)) ([8784b3a](https://github.com/andr-235/parseVK/commit/8784b3a90180bd23197380d8999ca44fb91ffa17)), closes [#179](https://github.com/andr-235/parseVK/issues/179)
* refactor comments table components and add new features ([d8b49de](https://github.com/andr-235/parseVK/commit/d8b49de51ea7f0bc7444ad030d1e230bed61bcfb))
* refactor friends export pages into a unified component for VK and OK platforms ([a689e3d](https://github.com/andr-235/parseVK/commit/a689e3d5b742d0d2a66203da6d5337ec35c9fc0d))
* **skills:** add parsevk-page-craft skill for page-level UI implementation ([3544736](https://github.com/andr-235/parseVK/commit/354473614e769decbda0fb87b6302b082bb4d47f))
* **style:** глобальный редизайн всех страниц под оранжево-терракотовую гамму Grapho ([3b75cdc](https://github.com/andr-235/parseVK/commit/3b75cdc8a2b9eddcaf77063f34fd06492ed68039))
* **tasks:** add keyboard navigation to TaskItem component ([#236](https://github.com/andr-235/parseVK/issues/236)) ([5d1c129](https://github.com/andr-235/parseVK/commit/5d1c1296234d7494aea58dbcf1062dba3cd0c4b5)), closes [#235](https://github.com/andr-235/parseVK/issues/235)
* **telegram-dl-import:** migrate telegram-dl-import module from nestjs to content-service ([62e2224](https://github.com/andr-235/parseVK/commit/62e2224e5c7d681a33c15a585d9494495519c717))
* **telegram-dl-match:** migrate telegram-dl-match module from nestjs to content-service ([3f28a9a](https://github.com/andr-235/parseVK/commit/3f28a9a3820359de9bfd51f72e44ae17c863de61))
* **telegram-service:** add minimum working version - pyproject.toml, app entrypoint, in-memory repo ([a50f9f5](https://github.com/andr-235/parseVK/commit/a50f9f5b3a16d465db4b1fe6c51b78ad124d32fb))
* **telegram-service:** replace simulation client with Telethon and proxy support ([a4074a3](https://github.com/andr-235/parseVK/commit/a4074a367a3a877b59b4d97adb2b98e401467d6b))
* **telegram-service:** resolve target usernames and numeric IDs, and handle hidden member exceptions ([da1828b](https://github.com/andr-235/parseVK/commit/da1828bf63caa431d469eab88bdfc2b2e4801d26))
* **telegram:** implement live parsing and user dialogs selection ([b9db129](https://github.com/andr-235/parseVK/commit/b9db129909c45890eaa0ae7590423a5dab97859d)), closes [#telegram-live-parse](https://github.com/andr-235/parseVK/issues/telegram-live-parse)
* **tgmbase-search:** migrate tgmbase-search module from nestjs to content-service ([e2a38cb](https://github.com/andr-235/parseVK/commit/e2a38cb69b29b6aa55dc0a697931a3904609b8bf))
* **ui:** добавить компоненты Button, Checkbox, Input, Select и Skeleton для пользовательского интерфейса ([f9cb481](https://github.com/andr-235/parseVK/commit/f9cb481a4edcb58857935a9cbe3b8e918e48d54f))
* **ui:** добавить компоненты ConfirmAction и ErrorState с соответствующими типами и функционалом ([59173ae](https://github.com/andr-235/parseVK/commit/59173aec32dde4755f78dd941be58170e89b4916))
* **ui:** добавление компонентов Spinner, FeedbackToast и TableError ([e02ff94](https://github.com/andr-235/parseVK/commit/e02ff9406daf20bdcbbd0e758a05058e1ea9d352))
* **ui:** обновить компоненты Checkbox и Input, добавить новый компонент PasswordInput ([ae47c3d](https://github.com/andr-235/parseVK/commit/ae47c3d86ceb321647237332069c0821bd17d1c2))
* **ui:** обновить структуру приложения и добавить страницы для управления комментариями, задачами и группами ([5ba2328](https://github.com/andr-235/parseVK/commit/5ba2328dfeaa01ae0e82bf9cbb0854d92487d91f))
* **users:** добавить функционал обновления пользователя и соответствующие схемы ([4855d9a](https://github.com/andr-235/parseVK/commit/4855d9ae364534d25ef02d3f989adafd93b21ad2))
* **validate-service:** add --no-db flag for proxy services ([2735e8a](https://github.com/andr-235/parseVK/commit/2735e8aa72a9be181c619401721cd3d2b04743e3))
* **vk-friends:** migrate vk friends export logic to fastapi and gateway ([#184](https://github.com/andr-235/parseVK/issues/184)) ([7fb80c6](https://github.com/andr-235/parseVK/commit/7fb80c6ab1fdc0f2555d271bbecdd98f6798c826)), closes [#169](https://github.com/andr-235/parseVK/issues/169)
* **vk-service:** add soft delete for groups, fetch groups from DB instead of config ([706dfb9](https://github.com/andr-235/parseVK/commit/706dfb965fb28b88421c196f0482ae5b22840ee0))
* **vk-service:** enhance post and comment retrieval to include profiles and groups ([9e7103c](https://github.com/andr-235/parseVK/commit/9e7103cc2a3d483eed106a72c87c6f51461fc228))
* **vk-service:** expand regional search fake groups ([df22e80](https://github.com/andr-235/parseVK/commit/df22e80213d03178978dd9881a9366810494436d))
* **vk-service:** harden VK ingestion execution flow ([#158](https://github.com/andr-235/parseVK/issues/158)) ([6027382](https://github.com/andr-235/parseVK/commit/60273821640c188b9c5a0a0fcf8d1276ee734c4a)), closes [#146](https://github.com/andr-235/parseVK/issues/146)
* добавить API для управления задачами и автоматизации ([01abc4f](https://github.com/andr-235/parseVK/commit/01abc4f74b3486e0c305a8d4f91b73d310bee833))
* добавить machine-readable output для parsevkctl ([#80](https://github.com/andr-235/parseVK/issues/80)) ([9e47b69](https://github.com/andr-235/parseVK/commit/9e47b699f79af6cfe8d7c5c248839e65641be987))
* добавить поддержку поля created_at для авторов и обновить сортировку по этому полю ([b1fbcde](https://github.com/andr-235/parseVK/commit/b1fbcdee571b7e0ae758856a63c12a523bfbe4c7))
* добавить поддержку фильтрации авторов по типу в репозитории и сервисе контента ([3732ea7](https://github.com/andr-235/parseVK/commit/3732ea7fb72a7840a79dbcdce8f79f1875d19447))
* добавить систему дизайна и оценку здоровья компонентов комментариев ([442ca5e](https://github.com/andr-235/parseVK/commit/442ca5ea890efc947d2a69f8dc3e39b1059fae27))
* добавить функции для работы с авторами и обработку ошибок ([7bd07ca](https://github.com/andr-235/parseVK/commit/7bd07caefae0cc65713cbfdc30a2f210d15bfd13))
* добавлен auth bff в api gateway ([a6329e0](https://github.com/andr-235/parseVK/commit/a6329e07a07e5baf9f3410c5d780bd6e0fa40dc8))
* добавлен consumer задач в vk service ([bebf9da](https://github.com/andr-235/parseVK/commit/bebf9da7b5d6d5e3c2f36ce69a89bf83a6dd3236))
* добавлен content api через gateway ([72733ad](https://github.com/andr-235/parseVK/commit/72733ad7bff7345466a73e88660bd0023c14c49d))
* добавлен content service projection ([89278fc](https://github.com/andr-235/parseVK/commit/89278fcbe645a9b7b5cec618e64c3409d4abcd86))
* добавлен docker smoke для vk content контура ([baf4f58](https://github.com/andr-235/parseVK/commit/baf4f5844c5d3ba9360719406a8f8fb46f65a8d0))
* добавлен execution api для tasks service ([fc73d3a](https://github.com/andr-235/parseVK/commit/fc73d3a6e04290c2101013cac67ae0cb0ef64c4e))
* добавлен outbox publish path для identity ([da1f714](https://github.com/andr-235/parseVK/commit/da1f7144ee9f081fa9cf9ecc1936d0db533dea56))
* добавлен outbox vk events ([bcb47a3](https://github.com/andr-235/parseVK/commit/bcb47a318224893f83550e327116e15e5654315f))
* добавлен outbox для tasks service ([bd3ab7f](https://github.com/andr-235/parseVK/commit/bd3ab7f2c1880e11bf9c73c2af9cad937532dede))
* добавлен tasks bff в api gateway ([5f83e4d](https://github.com/andr-235/parseVK/commit/5f83e4d39ce4f7ba136414571919bd3a0999681f))
* добавлен глобальный dry-run режим для parsevkctl ([#76](https://github.com/andr-235/parseVK/issues/76)) ([e7bdbf6](https://github.com/andr-235/parseVK/commit/e7bdbf670c5b61700e89e40a0d6b7cb663c40ebb))
* добавлен каркас python микросервисов ([d427664](https://github.com/andr-235/parseVK/commit/d427664e6fd674cb47be9739b63a598a3abc87c8))
* добавлен каркас tasks service ([388b804](https://github.com/andr-235/parseVK/commit/388b8040944bcc09f2f728b446b71fa55d5fb655))
* добавлен каркас vk service ([2a110f9](https://github.com/andr-235/parseVK/commit/2a110f959a6a46a5f6fe83df1448a3e8d5a00252))
* добавлен маршрутизатор задач в api gateway и удален старый сервис ([16c1993](https://github.com/andr-235/parseVK/commit/16c1993817d8894b18665a0ffec648c717cc7084))
* добавлена preflight-команда task doctor в parsevkctl ([#75](https://github.com/andr-235/parseVK/issues/75)) ([#85](https://github.com/andr-235/parseVK/issues/85)) ([8f5196d](https://github.com/andr-235/parseVK/commit/8f5196d5e9a8b02722b0a5f0602894e869383f6e))
* добавлена валидация конфигурации parsevkctl ([#78](https://github.com/andr-235/parseVK/issues/78)) ([#83](https://github.com/andr-235/parseVK/issues/83)) ([fbe484a](https://github.com/andr-235/parseVK/commit/fbe484aeaabbbea642023bdcff23ed333ad1bdf3))
* добавлена диагностика статуса задачи ([#72](https://github.com/andr-235/parseVK/issues/72)) ([#74](https://github.com/andr-235/parseVK/issues/74)) ([af507dd](https://github.com/andr-235/parseVK/commit/af507ddf197105b85ea650944bcd81a0e1eff217))
* добавлено enterprise-grade именование веток задач ([#73](https://github.com/andr-235/parseVK/issues/73)) ([#86](https://github.com/andr-235/parseVK/issues/86)) ([49eb8f2](https://github.com/andr-235/parseVK/commit/49eb8f23b5aa85b7571b22f9302a477522558172))
* добавлено vk ingestion хранилище ([4739903](https://github.com/andr-235/parseVK/commit/4739903d6e1f6694e1cfd146c2da73887faf1953))
* добавлены automation настройки tasks service ([d2dbe61](https://github.com/andr-235/parseVK/commit/d2dbe61da9ef8964952a0dbc331c5c9207c319ba))
* добавлены миграции и seed admin для identity ([e379bff](https://github.com/andr-235/parseVK/commit/e379bffabeb308ec5185c78223df5143e75df22c))
* добавлены строгие проверки перед созданием и слиянием PR ([#77](https://github.com/andr-235/parseVK/issues/77)) ([dfccf68](https://github.com/andr-235/parseVK/commit/dfccf682208e57cf6d811413a385423821b2e0e6))
* интеграция фронтенда с новым FastAPI контент-сервисом ([ee94892](https://github.com/andr-235/parseVK/commit/ee94892b0cc1843b9158d8c48032aed2f247a9ca))
* миграция admin API в FastAPI ([#127](https://github.com/andr-235/parseVK/issues/127)) ([#132](https://github.com/andr-235/parseVK/issues/132)) ([af72021](https://github.com/andr-235/parseVK/commit/af720210ef93f54e18d3368f20193a7ea423ec70))
* обновить страницу администраторов с новыми функциями и улучшениями интерфейса ([617e850](https://github.com/andr-235/parseVK/commit/617e850998be054731d48df1fe8523f1437108f4))
* переключен auth frontend на api gateway ([fb11ed1](https://github.com/andr-235/parseVK/commit/fb11ed181568dfbc7fc12e5fcd5f059d4554fd5c))
* переключен tasks frontend на api gateway ([a918788](https://github.com/andr-235/parseVK/commit/a918788d3ac4a0e996313c173b43b107a5820958))
* реализован api задач в tasks service ([d674515](https://github.com/andr-235/parseVK/commit/d67451517dfb04a8831ce99fe512fa7ecab7b99c))
* реализован auth core в identity service ([f685ce0](https://github.com/andr-235/parseVK/commit/f685ce09d0ff229f1e20c48a90e0b0a01502c15d))
* реализован moderation-service и интеграция с frontend ([#127](https://github.com/andr-235/parseVK/issues/127)) ([c61401f](https://github.com/andr-235/parseVK/commit/c61401f97dbe56b653063b8dbc4306a8e1f9e1d6))
* улучшен шаблон PR body в parsevkctl ([#82](https://github.com/andr-235/parseVK/issues/82)) ([#97](https://github.com/andr-235/parseVK/issues/97)) ([ef92164](https://github.com/andr-235/parseVK/commit/ef921648fdc4c85cadff761e18a5e37ee5fc6f05))
>>>>>>> 59c5b02f74109d896c970438b9ab9949727f89da
