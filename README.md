# fhe-drm
On chain DRM system using Zama's fhEVM

## How it works

Our implementation describes two ownership scenarios, when a new record is created:
1. An asset e.g. video file, document can be linked to a new or existing NFT. This NFT represents ownership of the underlying asset.
2. In the second scenario an asset linked to a new or existing collection. Every NFT in this collection represents ownership of the asset and grants various roles and actions e.g. CRUD, sharing, etc.

