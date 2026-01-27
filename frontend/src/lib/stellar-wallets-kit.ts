import { StellarWalletsKit, SwkAppDarkTheme } from '@creit-tech/stellar-wallets-kit';
import { AlbedoModule } from '@creit-tech/stellar-wallets-kit/modules/albedo';
import { FreighterModule } from '@creit-tech/stellar-wallets-kit/modules/freighter';

StellarWalletsKit.init({
    theme: SwkAppDarkTheme,
    modules: [
        new AlbedoModule(),
        new FreighterModule()
    ]
})

export default StellarWalletsKit