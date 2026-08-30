use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum TipJarError {
    /// tip amount must be greater than zero
    InvalidAmount = 1,
    /// tipper and hunter must be different addresses
    InvalidParties = 2,
}
