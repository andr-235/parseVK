## [0.17.1](https://github.com/andr-235/parseVK/compare/v0.17.0...v0.17.1) (2026-02-13)


### Bug Fixes

* **listings:** вынести queryWithContactSort из транзакции для совместимости с Prisma ([5d8c8f4](https://github.com/andr-235/parseVK/commit/5d8c8f48e716844be3e839ba790742e58ea16188))

# [0.17.0](https://github.com/andr-235/parseVK/compare/v0.16.0...v0.17.0) (2026-02-13)


### Features

* **listings:** добавить сортировку по контакту в репозитории и сервисе ([4b4facb](https://github.com/andr-235/parseVK/commit/4b4facb9739bdc3f59ed6d850bfffe362d1ed93c))

# [0.16.0](https://github.com/andr-235/parseVK/compare/v0.15.0...v0.16.0) (2026-02-13)


### Bug Fixes

* align api types with module watchlist types ([6776174](https://github.com/andr-235/parseVK/commit/6776174a700a5a8ae3c4042aad8342bb5597c63b))
* **api:** update production start script and enhance TypeScript configuration for better build management ([013377a](https://github.com/andr-235/parseVK/commit/013377a3e0d4f83ad9bb02f6c8a732523ca575a6))
* **api:** включение spec и e2e в tsconfig для ESLint projectService ([06240a1](https://github.com/andr-235/parseVK/commit/06240a11b16b9ead04496d0298de49d5761f72ad))
* **api:** исправлены падения Vitest — reflect-metadata, jest-compat, unplugin-swc ([efe9e32](https://github.com/andr-235/parseVK/commit/efe9e3232040126e2f93bf6ed1f66d679d4194da))
* **api:** обновление DATABASE_URL в Prisma config ([7822652](https://github.com/andr-235/parseVK/commit/7822652e434eef7d198b58aed0a169b216996810))
* **api:** убрана строгая типизация globalThis.jest в vitest.setup ([d04e703](https://github.com/andr-235/parseVK/commit/d04e7031c776d07e0d4167425b5b31fc00be74fc))
* **authors:** update boolean value handling in ListAuthorsQueryDto ([713fbdb](https://github.com/andr-235/parseVK/commit/713fbdbea012aa827cb6295ed69f5cda1beb33e4))
* **auth:** подключить refreshTokenExtractor к JwtRefreshStrategy ([a3b17d1](https://github.com/andr-235/parseVK/commit/a3b17d1399692ab0f0d1ce2182a09976f5ac7ed7))
* **auth:** типизировал current user и убрал дублирование проверки ([52e207d](https://github.com/andr-235/parseVK/commit/52e207dcd9600758a88046d6611cb270f9453039))
* correct import path for package.json in SidebarFooter component ([c52c74e](https://github.com/andr-235/parseVK/commit/c52c74e2758b8349916ba42e76ac3865fb1f1ad4))
* **docker:** add retry logic for package installation in backend Dockerfile ([1b53f0a](https://github.com/andr-235/parseVK/commit/1b53f0aa1b2cf727354f199f9d7ebaefd1c1a3c7))
* **docker:** enhance backend Dockerfile for native module builds ([1ef30ab](https://github.com/andr-235/parseVK/commit/1ef30ab0e471c4a23b2df4431f508f27ddba1769))
* **docker:** enhance error handling for Prisma migration conflicts in backend entrypoint script ([7d205d8](https://github.com/andr-235/parseVK/commit/7d205d8bf0353fc94ccc15e43a17301261d100ba))
* **docker:** enhance error handling for Prisma migration failures in backend entrypoint script ([53db1f9](https://github.com/andr-235/parseVK/commit/53db1f9cf7a0ab5f43e9e27f8854329f54f8383a))
* **docker:** enhance healthcheck command and increase start period for services ([582b089](https://github.com/andr-235/parseVK/commit/582b089cfdbc5e8c2a9d60e1b159c018b776c06e))
* **docker:** enhance Prisma generation process in backend Dockerfile ([3de134b](https://github.com/andr-235/parseVK/commit/3de134b85bad3e264ca37571521a900f7678309c))
* **docker:** improve backend entrypoint script to handle multiple Prisma Client generation paths and enhance error reporting ([fdc29cf](https://github.com/andr-235/parseVK/commit/fdc29cfe0b98d97929a97c40fe55907eefbd8dc0))
* **docker:** improve bcrypt verification and rebuild process in Dockerfile ([4da0387](https://github.com/andr-235/parseVK/commit/4da0387b72649e39eddfaa6a9ba1b17e6b671106))
* **docker:** improve error handling for Prisma migrations and bcrypt rebuild verification ([9dbc949](https://github.com/andr-235/parseVK/commit/9dbc94926903843b2ef918967bf59880fb5e766c))
* **docker:** improve error handling in backend entrypoint script for Prisma migrations ([0575567](https://github.com/andr-235/parseVK/commit/0575567e02232ec4b4df6bcaa2ac250be5a7c1f4))
* **docker:** optimize backend Dockerfile for native module handling ([0daaba8](https://github.com/andr-235/parseVK/commit/0daaba8af8a08b34dd5b7fea7112cfbc553fc236))
* **docker:** remove invalid npm network-timeout option and clean up healthcheck command ([1b9dd49](https://github.com/andr-235/parseVK/commit/1b9dd49961fde3a5fbd7a3ef7c8777f8d4152d53))
* **docker:** replace pnpm build command with npx tsc for TypeScript compilation in backend Dockerfile ([6d2d498](https://github.com/andr-235/parseVK/commit/6d2d49827e1f614e776e3df9e922412f0f449f55))
* **docker:** update backend Dockerfile for bcrypt rebuild and dependency management ([aa4df68](https://github.com/andr-235/parseVK/commit/aa4df68fe48852bcdbe7d8a15923f919cf05085d))
* **docker:** update healthcheck command and extend start period for services ([809fb48](https://github.com/andr-235/parseVK/commit/809fb482492f6203de349a319a3076ebf671001e))
* **docker:** update healthcheck script to use .mjs extension ([aee9dd6](https://github.com/andr-235/parseVK/commit/aee9dd6e7447386eff180bdad161c22da8e1980e))
* **docker:** update Prisma Client generation to use npx tsc for consistent output structure in backend Dockerfile ([e9446f6](https://github.com/andr-235/parseVK/commit/e9446f630ff8f3242c4e5f1426814ea22c68a5e7))
* **docker:** обновлен backend Dockerfile for improved native module handling ([be67e6d](https://github.com/andr-235/parseVK/commit/be67e6d35ceaddeaf86d9c8cc4e6b0a00c2525eb))
* **groups:** improve spacing in GroupCard content sections ([d82f16a](https://github.com/andr-235/parseVK/commit/d82f16a47ede0c099a1baff590f630196fbc4f75))
* **groups:** resolve card layout issues with equal heights and proper spacing ([6e88a74](https://github.com/andr-235/parseVK/commit/6e88a74d348e095ca093454a517f3949cd4b6e4d))
* **listings:** исправить обработку булевого параметра archived в DTO ([e3dea87](https://github.com/andr-235/parseVK/commit/e3dea8791f7adc1c196b518f77e201c083ee029c))
* **listings:** починить фильтр архива и визуальное выделение ([9843d3b](https://github.com/andr-235/parseVK/commit/9843d3bb52e1773486b3df88361714e2bb072f60))
* **monitoring:** ensure immutability of active source array in useMonitoringViewModel ([e1ee83c](https://github.com/andr-235/parseVK/commit/e1ee83c9ba28e57fc119433df93e7505af3f3efa))
* **monitoring:** make category field optional in MonitoringGroupUpsertArgs type ([79ebb84](https://github.com/andr-235/parseVK/commit/79ebb840deb1f575ce5bc1645a1ba2bf6a377d5f))
* **monitoring:** update groupChatIdColumn assignment logic ([4cc20ab](https://github.com/andr-235/parseVK/commit/4cc20abb5dceb82da947a023b0a0e404b8123ec7))
* **monitoring:** update value type to include Date for monitoring service ([515c519](https://github.com/andr-235/parseVK/commit/515c5194c61eb67fd25dedfddf0812d767295a93))
* **ok-friends:** add validation for applicationKey and enhance logging ([c8b9d22](https://github.com/andr-235/parseVK/commit/c8b9d2262cfb8a833a868e36868bd59546e35563))
* **ok-friends:** enforce mandatory fields parameter and enhance users.getInfo logic ([a4b4e02](https://github.com/andr-235/parseVK/commit/a4b4e029000e3d13bf3f18a56e7e124e1d750170))
* **ok-friends:** enhance logging and fallback handling for users.getInfo fields parameter ([9919ec1](https://github.com/andr-235/parseVK/commit/9919ec1327c171019077066a771f6bb348ad7834))
* **ok-friends:** enhance logging for OK API service ([f4bef6b](https://github.com/andr-235/parseVK/commit/f4bef6b4ad2abd27925e58303788ed39276823b7))
* **ok-friends:** enhance logging for OK API service diagnostics ([3ae8255](https://github.com/andr-235/parseVK/commit/3ae8255c82ba26b40a15b64dd832fec89c912a2b))
* **ok-friends:** enhance response handling in OK API service ([a670832](https://github.com/andr-235/parseVK/commit/a67083246ed298c6a39a5959a5ec9fb841e2342d))
* **ok-friends:** implement users.getInfo signature handling and update API request logic ([9517410](https://github.com/andr-235/parseVK/commit/95174103a6c25313c4d5f845a6c9430f8259e2a0))
* **ok-friends:** improve error handling in OK API service responses ([f448e43](https://github.com/andr-235/parseVK/commit/f448e430cff3eb5014af53eed5805ab2a4de98ff))
* **ok-friends:** improve getJobById method and update ExportJob creation ([0d818ca](https://github.com/andr-235/parseVK/commit/0d818cab36e7ca5fd27ba4b6a84a4e48bb30ea6e))
* **ok-friends:** improve logging and handling of fields parameter in users.getInfo ([001176d](https://github.com/andr-235/parseVK/commit/001176d7a77b9c13745dda70c3afa3ab4caf4df7))
* **ok-friends:** refine fields parameter handling in users.getInfo method ([529b0ba](https://github.com/andr-235/parseVK/commit/529b0ba880a759ed40df3fffc0881731f1303115))
* **ok-friends:** update fields list in users.getInfo method to align with official documentation ([7a31547](https://github.com/andr-235/parseVK/commit/7a315475674d17bd9095fbc1d9c87092b88711ec))
* **ok-friends:** update fields parameter handling in users.getInfo ([ee494e7](https://github.com/andr-235/parseVK/commit/ee494e7d04ab6470c80f8214a146165ded0ea5ef))
* **ok-friends:** update logging and documentation for OK API service ([41ce62b](https://github.com/andr-235/parseVK/commit/41ce62b879c8ad53c231afa870f1695b16c70952))
* **ok-friends:** update OK API base URL for clarity ([f94d7b4](https://github.com/andr-235/parseVK/commit/f94d7b43ff811cb68fb6d522cb4e8d5bcb7950d8))
* satisfy lint for monitor metadata type ([6e21e1d](https://github.com/andr-235/parseVK/commit/6e21e1d3892ed088e2ac1734ca723e28356b584f))
* **types:** обновить пути импорта для типов PhotoAnalysis и createEmptyPhotoAnalysisSummary ([11a3d30](https://github.com/andr-235/parseVK/commit/11a3d30f46af70ac1c5e253a7e50d64f5c2c5162))
* **ui:** improve ProgressBar accessibility and animation performance ([255c96d](https://github.com/andr-235/parseVK/commit/255c96dab26fdfceaf46331b7fad46846639279a))
* update frontend URL in smoke tests and deployment workflow ([ae3e161](https://github.com/andr-235/parseVK/commit/ae3e1612be63f963c504d472f1f67c769bb1caa0))
* use module watchlist types in api ([2f1dd12](https://github.com/andr-235/parseVK/commit/2f1dd1245ba2b1c01444cadf75b963117c9511c0))
* **vk-friends:** добавлена проверка существования и доступности DOCX файла после его создания ([720fbe5](https://github.com/andr-235/parseVK/commit/720fbe5a7848ef1ad7f31ed0c30be98cc0ebf1ac))
* **vk-friends:** улучшена логика скачивания DOCX файла с использованием буфера ([8a50c1c](https://github.com/andr-235/parseVK/commit/8a50c1c514f8c1e7ca54130ec7332b0d4f8868c7))
* **vk-friends:** улучшена обработка загрузки файлов и добавлена проверка на существование файла ([11d2847](https://github.com/andr-235/parseVK/commit/11d2847c61821e1d078d9d2819aa5a3dd5cf3b15))
* **vk-friends:** уточнён тип данных для маппинга пользователей VK, улучшена типизация в контроллере ([6938b69](https://github.com/andr-235/parseVK/commit/6938b695117d618191a59931d128f3d8ccb1eace))
* заменить bcrypt на bcryptjs для Docker ([6cf55bc](https://github.com/andr-235/parseVK/commit/6cf55bc9c05c950090c8ac1dd4e1d677b5291d3e))
* исправлена проблема со скачиванием DOCX файла экспорта друзей ([f35ff5f](https://github.com/andr-235/parseVK/commit/f35ff5f6c3cc151770d231075d7d131bccca119b))
* починены импорты и ref-типы для сборки ([76632c2](https://github.com/andr-235/parseVK/commit/76632c2df0fdb24433e159ce8fb8ebab4e82835f))


### Features

* add frontend-design and vercel-react-best-practices skills with comprehensive guidelines and optimizations ([eccd1b5](https://github.com/andr-235/parseVK/commit/eccd1b5c94188781e683e991a393a4ef2b4c505d))
* add monitoring groups management ([62756e7](https://github.com/andr-235/parseVK/commit/62756e7913dfa9af7c98ca90390904e2d9f5cc24))
* add VITE_APP_VERSION to environment variables and update SidebarFooter to display app version ([d39ccf5](https://github.com/andr-235/parseVK/commit/d39ccf5c2aa3b68aa98dbddcc0a2a4e2da11f836))
* **adminUsers, authors, keywords, monitoring:** introduce new hero components for user, author, keyword, and monitoring sections ([f6559e0](https://github.com/andr-235/parseVK/commit/f6559e0cc188c91ed195cf0be800f16766dd0220))
* **api:** add author deletion functionality and UI integration ([485e327](https://github.com/andr-235/parseVK/commit/485e327f2c1a361aafe661ca62ae8d5a172a65b9))
* **api:** add MONITOR_DATABASE_URL environment variable and integrate cookie-parser middleware ([505ed3c](https://github.com/andr-235/parseVK/commit/505ed3c00c397fe36ed5d1fb346406d2a8fce711))
* **api:** add Russian headers and translations for friend data export ([1c61c2d](https://github.com/andr-235/parseVK/commit/1c61c2d8ca8cbc6043b6092742a094dc5b641a7f))
* **api:** enhance users.getInfo with comprehensive field validation ([e433e3b](https://github.com/andr-235/parseVK/commit/e433e3baa6aa7af7afe41e9508b1da6057d8339a))
* **auth:** migrate password hashing from bcrypt to argon2 ([78eb505](https://github.com/andr-235/parseVK/commit/78eb505db33afeecd745d9046e3df0176bc8daf1))
* **authors, comments, tasks:** добавить useStore для authors, comments и tasks ([8b8172e](https://github.com/andr-235/parseVK/commit/8b8172eacf3060c5bd21e485c2afb2284bfcddd8))
* **authors:** add author verification functionality ([54e1a2b](https://github.com/andr-235/parseVK/commit/54e1a2bf241686851aa7be19e87432f060bf580a))
* **authors:** add city field to AuthorCard and update related components ([56e3df0](https://github.com/andr-235/parseVK/commit/56e3df0cfc443c1dbea0b114408bbe82806c73b1))
* **authors:** enhance AuthorsTableCard to display city information ([ce8edb4](https://github.com/andr-235/parseVK/commit/ce8edb468ce6f67a28f606d2f6449b66cf032898))
* **authors:** implement author verification and state management ([3f9e06a](https://github.com/andr-235/parseVK/commit/3f9e06a0020dbc83d9e634a7aa48732d3ad8aa73))
* **authors:** добавлено поле сортировки по городу и соответствующая логика обработки ([03e7392](https://github.com/andr-235/parseVK/commit/03e73921e404ba23c036ed7ab6b0897d77af860c))
* **authors:** добавлено поле фильтрации по городу и соответствующая логика обработки в сервисах и компонентах ([6c0127f](https://github.com/andr-235/parseVK/commit/6c0127fc541e87917a792c03a205d66814076fc4))
* **ci:** enhance CI workflow to dynamically generate project matrix for linting and type checking ([648b6f3](https://github.com/andr-235/parseVK/commit/648b6f3797b06bdf051f4de353c5148ceb0dd589))
* **comments, keywords:** enhance keyword loading and state management ([05fa2b0](https://github.com/andr-235/parseVK/commit/05fa2b07e7969cc95aae173fa56b2a56f081ac53))
* **comments:** apply Intelligence Hub + React best practices to CommentCard ([1364aac](https://github.com/andr-235/parseVK/commit/1364aac128d06a7278068e2b52b76ff66a1cf020))
* **comments:** apply Intelligence Hub design to CommentsPage and CommentsHero ([f2ff078](https://github.com/andr-235/parseVK/commit/f2ff0788bdf1d44ea26bb902aba3812a84d714c4))
* **comments:** refactor CommentsFiltersPanel with Intelligence Hub design and React optimization ([bb56d49](https://github.com/andr-235/parseVK/commit/bb56d498b55315f832280226a48fd2b138a04327))
* **comments:** refactor CommentsTableCard with Intelligence Hub design and React optimization ([9d4ac28](https://github.com/andr-235/parseVK/commit/9d4ac28234ab9315a284f1b2571a3acd50b73121))
* **comments:** refactor CommentThread and CommentThreadItem with Intelligence Hub design and React optimization ([11ec638](https://github.com/andr-235/parseVK/commit/11ec6388f3536654d59fb29ca61988acdcb2224e))
* **comments:** refactor PostGroupCard with Intelligence Hub design and React optimization ([dc06eff](https://github.com/andr-235/parseVK/commit/dc06eff19179ac5d81c728f940d7154710746fc2))
* **data-import:** добавить тест для парсинга строковых цен с символами валюты ([eafe003](https://github.com/andr-235/parseVK/commit/eafe00359de33e7b3f22375634a282045d5a9b2a))
* **design-system:** introduce comprehensive design system for Intelligence Hub ([018b6c0](https://github.com/andr-235/parseVK/commit/018b6c0fc9695242d83ae0718c6ebdd14f2066a5))
* **docker:** add Prisma Client generation to backend entrypoint script ([5d70c68](https://github.com/andr-235/parseVK/commit/5d70c68336a942f97ac3ff2f6b2905d8a6c6a6de))
* **docker:** switch to build context for API and frontend services in docker-compose ([e926e6a](https://github.com/andr-235/parseVK/commit/e926e6a5118dd95d7cf8cb0827c11e1f3750c2b7))
* **docs:** enhance CLAUDE.md with project overview, code quality standards, and best practices ([1393ff7](https://github.com/andr-235/parseVK/commit/1393ff771a5f38b325f361acb374d13f2ed63029))
* enhance GitHub Actions workflow for security scanning ([903fbfa](https://github.com/andr-235/parseVK/commit/903fbfade5d7a41f63983cc9c854dd4d97207a15))
* **groups:** refactor RegionGroupsSearchCard with new components and hooks ([133e070](https://github.com/andr-235/parseVK/commit/133e070086ec6bec94d0318f1cc2af27406a9a03))
* **listings:** enhance ListingsHero and ListingsPage with new layout and functionality ([5b2e80b](https://github.com/andr-235/parseVK/commit/5b2e80be7e09bb0f6c57941694e70e8417de8329))
* **listings:** добавить возможность копирования URL автора в таблице ([fe03283](https://github.com/andr-235/parseVK/commit/fe03283c16a91d2c125d1bf3b1e105ecd76cc555))
* **listings:** добавить модальное окно для создания объявления и соответствующий функционал ([8aa67a5](https://github.com/andr-235/parseVK/commit/8aa67a5f23013b427bf78ce67eff591818684473))
* **listings:** добавить поддержку сортировки по URL автора ([ed9fad2](https://github.com/andr-235/parseVK/commit/ed9fad2f158362901f2f03fb117afde89ff95244))
* **listings:** добавить поле URL автора в форму создания объявления ([94cf14d](https://github.com/andr-235/parseVK/commit/94cf14d82ea5843b5e15753151a84d84c0f14d70))
* **listings:** добавить полное редактирование записи из строки таблицы ([09a17d1](https://github.com/andr-235/parseVK/commit/09a17d14e0bc1f2e2fba1563a442585a17bd74b8))
* **listings:** добавить сортировку для списка объявлений ([c0b4559](https://github.com/andr-235/parseVK/commit/c0b45591638856db06187311b7754e57d4cc2819))
* **listings:** добавить сортировку по sourceAuthorName с вторичным ключом contactName ([12242ce](https://github.com/andr-235/parseVK/commit/12242ce210576067cf4498ae94ff8b30733e0129))
* **listings:** добавить столбец URL автора в таблицу объявлений ([613bec6](https://github.com/andr-235/parseVK/commit/613bec65236139d8126d9b0011bfb7da49a414f4))
* **listings:** добавить функциональность удаления объявлений и новый компонент таблицы ([70ae8ab](https://github.com/andr-235/parseVK/commit/70ae8abf14efb6dd378a05252f94bc52ffc2cf1b))
* **listings:** улучшить отображение заголовков и заметок в строках списка ([506c24c](https://github.com/andr-235/parseVK/commit/506c24cd89d73a8b7fe22f8383e17b4c445f91f4))
* **listing:** обновлено дто сортировки ([0c0a74d](https://github.com/andr-235/parseVK/commit/0c0a74d8cec45e99bee1d2c47c825b04e4753292))
* **monitoring:** add date filtering to message retrieval ([e9482a9](https://github.com/andr-235/parseVK/commit/e9482a9e0b1eaabfe6a6afdf7dd1d33e68d0c6f1))
* **monitoring:** add group sync logging ([53ae6a5](https://github.com/andr-235/parseVK/commit/53ae6a5d5fc6d59135a3ecf3e8cb40802a10db3c))
* **monitoring:** add monitoring section to sidebar ([6bcc8ea](https://github.com/andr-235/parseVK/commit/6bcc8ea4e687e7da7bcfb202621a9bf42e84c27b))
* **monitoring:** add source filtering to message retrieval ([fbfb8b9](https://github.com/andr-235/parseVK/commit/fbfb8b9328c6ea28e31f6f98cac725fb56e3876f))
* **monitoring:** add WhatsApp groups management and synchronization ([540ce2d](https://github.com/andr-235/parseVK/commit/540ce2d684b625bc53b784460b2139fb3a87c0f7))
* **monitoring:** enhance monitoring UI and functionality ([6b81db5](https://github.com/andr-235/parseVK/commit/6b81db5c8196b0949ff764a83eaafcbbfee58e29))
* **monitoring:** enhance MonitoringMessagesCard with keyword highlighting and source logos ([6d4adff](https://github.com/andr-235/parseVK/commit/6d4adff975d0608b7e187afee40f3104cf6a6ec9))
* **monitoring:** implement monitoring feature for message tracking ([4aa8464](https://github.com/andr-235/parseVK/commit/4aa84644cf88de01aadb3a6b4401fa7f0c8e696d))
* **monitoring:** implement pagination for message retrieval ([14647e9](https://github.com/andr-235/parseVK/commit/14647e9e127cff93288e4262c482bf77bca297e4))
* **ok-friends:** add OK Friends export functionality ([c6ae14e](https://github.com/andr-235/parseVK/commit/c6ae14eb6ad6527e24385b935224cdb018cd4194))
* **ok-friends:** implement OK Friends module for managing friends data ([628e211](https://github.com/andr-235/parseVK/commit/628e211e569dae2efcfe0199dcdfd02ed6119cc3))
* **prisma:** add okUserId and okFriendId fields to ExportJob and FriendRecord models ([9a0d53e](https://github.com/andr-235/parseVK/commit/9a0d53e1480f9ce1a7e029be853482f6783dcf82))
* **release:** настроить semantic-release для автоматизации релизов ([8b57970](https://github.com/andr-235/parseVK/commit/8b579707559d058968df247b92567c9178f1923b))
* render monitoring content from metadata ([1648c59](https://github.com/andr-235/parseVK/commit/1648c596f9fed2e1e26613a75302e8f5fba822c5))
* **security:** добавить загрузку образов Docker для сканирования ([bd3bc57](https://github.com/andr-235/parseVK/commit/bd3bc57c301174f1daa1bba36b431950046fc830))
* **sidebar:** мемоизировать частицы для предотвращения пересоздания на каждом рендере ([b005b6c](https://github.com/andr-235/parseVK/commit/b005b6c381fe62cdfb03104f6bceb3796ebd6f82))
* **skill:** add Nest.js expert skill documentation ([5a6b850](https://github.com/andr-235/parseVK/commit/5a6b85010f3d82e009e42e2f569cd272658cd171))
* **task:** add TaskAuditLog model and integrate with Task ([52589fe](https://github.com/andr-235/parseVK/commit/52589fe8cd6722e469fcd82c6f7ad135a77add3b))
* **tasks:** оптимизировать загрузку групп и создание задач с помощью параллельного выполнения ([628cb2d](https://github.com/andr-235/parseVK/commit/628cb2d051419f556e89bb86b8cb37410ed0035b))
* **ui-ux-pro-max:** add new skill with comprehensive design guidelines and scripts ([adb8ffc](https://github.com/andr-235/parseVK/commit/adb8ffc76db0e2069cf6e7161fe932e5af357dcf))
* **ui:** enhance group components with improved styling and animations ([b2340c8](https://github.com/andr-235/parseVK/commit/b2340c898ded856253cfe8ff923ce73833b2d0d0))
* **ui:** enhance ProgressBar component with new tone option and styling improvements ([c7e8985](https://github.com/andr-235/parseVK/commit/c7e89858492488ee933513b6f5daf3e37832e9b9))
* **ui:** enhance Sidebar components with new animations and styling ([7cabffe](https://github.com/andr-235/parseVK/commit/7cabffed2ce36e4f6d1c73732b7f3b06f637d181))
* **ui:** enhance UI components with improved styling and animations ([07b9793](https://github.com/andr-235/parseVK/commit/07b979305daeabadc327594c866195e72d73fb88))
* **vk-friends:** добавлен модуль, контроллер и сервис для работы с друзьями VK ([97673cf](https://github.com/andr-235/parseVK/commit/97673cf2a72a91b626958b9c4fafbba428f85ff2))
* **vk-friends:** добавлен функционал для восстановления экспортных файлов и улучшена обработка параметров экспорта ([7b3625d](https://github.com/andr-235/parseVK/commit/7b3625d13fefbd75cca6c717bdc88a143fb43fa7))
* **vk-friends:** добавлен функционал для генерации и загрузки DOCX отчётов, улучшена логика обработки статуса задания ([2a69ba2](https://github.com/andr-235/parseVK/commit/2a69ba2f39637442a1d1129fea73b93285378aae))
* **vk-friends:** добавлен функционал для экспорта друзей VK в XLSX и DOCX, включая новые модели, сервисы и контроллеры ([3542776](https://github.com/andr-235/parseVK/commit/3542776c090edf6615344749f924bd9818a7fe71))
* **vk-friends:** добавлен хук useVkFriendsExport для управления экспортом друзей VK, включая обработку логов и состояния задания ([b54a1b7](https://github.com/andr-235/parseVK/commit/b54a1b7c5b2be54079bf47cdaf8ea5de42fa3189))
* **vk-friends:** добавлена страница экспорта друзей VK с параметрами и логами, обновлены маршруты и боковое меню ([5e03a24](https://github.com/andr-235/parseVK/commit/5e03a2463a79716427191161c5aa59c95bb2f2cf))
* **vk-friends:** добавлены новые таблицы и типы для обработки экспортных заданий и логов ([117b093](https://github.com/andr-235/parseVK/commit/117b0934975ab5d919f066374b9532ca3ceda9ea))
* **vk-friends:** обновлён функционал экспорта друзей с поддержкой XLSX формата ([57ab792](https://github.com/andr-235/parseVK/commit/57ab7929e21a0e1103253365b6c39ed76c955dbe))
* **vk-friends:** обновлён функционал экспорта друзей с поддержкой XLSX формата ([58e94f5](https://github.com/andr-235/parseVK/commit/58e94f5ad264fd650fc1f7f7512e0530c0acb51c))
* **vk-friends:** улучшена обработка событий потока VK, добавлены типы для 'progress', 'log', 'done' и 'error' ([9517f26](https://github.com/andr-235/parseVK/commit/9517f26f08200d28f5425f6a97757b593305814b))
* **vk-friends:** фоновый экспорт друзей, file/params util, constants ([ae01dd5](https://github.com/andr-235/parseVK/commit/ae01dd5c08afb11c7a50aebdda8dcc90e866a533))
* добавлен компонент CircularProgress для отображения прогресса экспорта друзей ВКонтакте ([6fcd42a](https://github.com/andr-235/parseVK/commit/6fcd42a25de4062443259129b13eda0086c5dd4c))
* добавлена интеграция users.getInfo и экспорт всех полей в XLSX ([5ad1fb1](https://github.com/andr-235/parseVK/commit/5ad1fb140b7e64ca918f1ad9286ff828a9ad1f97))


### Performance Improvements

* **comments:** optimize hooks with React best practices (memoization) ([a56303c](https://github.com/andr-235/parseVK/commit/a56303ca3b030bef071e11b8b2af8e026f10d73f))

# Changelog

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).

## [Unreleased]

### Added

- (Нет новых добавлений в текущем цикле)

### Changed

- API: переход с Jest на Vitest для unit и e2e тестов
- API: установка зависимостей через Bun (`bun install`), скрипты через `bun run` / `bunx`
- API: ESM-режим (`"type": "module"`), совместимость с Vitest и NestJS
- Docker: backend healthcheck переведён на ESM (`backend-healthcheck.mjs`)
- CI: code-quality и тесты используют Bun (lint, type-check, format-check, test)

### Fixed

- API: падения Vitest из-за reflect-metadata и совместимости с NestJS (jest-shims, unplugin-swc)
- API: убрана строгая типизация `globalThis.jest` в vitest.setup
- Docker: улучшена генерация Prisma Client в backend Dockerfile и entrypoint (повторы при сетевых ошибках, несколько путей)
- Docker: сборка backend через `npx tsc` вместо pnpm build для единообразной структуры вывода

### Removed

- API: Jest и связанные конфигурации (jest.config и т.п.)

---

## Предыдущие изменения

История до введения CHANGELOG отражена в git: переход на Prisma 7, обновления tsconfig.build, .dockerignore, CI (Dependabot для actions/cache, codeql-action, setup-node) и др.
