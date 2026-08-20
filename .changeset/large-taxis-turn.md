---
'@pro6pp/infer-js': patch
'@pro6pp/infer-core': patch
'@pro6pp/infer-react': patch
---

Added destroy() method to properly clean up DOM/event listeners, preventing duplicate instances for example when switching countries. Added separate CSS file export as alternative to auto injected styles. Added comma between street and house number to fix bug when editing additions within the input.
