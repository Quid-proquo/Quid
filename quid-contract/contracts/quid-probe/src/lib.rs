#![no_std]

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, Env, Symbol, Vec,
};

const INTERACTION_TTL_LEDGERS: u32 = 5_184_000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Interaction {
    pub mission_id: u64,
    pub hunter: Address,
    pub caller_contract: Address,
    pub count: u64,
    pub first_ledger: u32,
    pub last_ledger: u32,
    pub functions: Vec<Symbol>,
}

#[contracttype]
pub enum DataKey {
    Interaction(u64, Address, Address),
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ProbeError {
    InteractionCountOverflow = 1,
}

#[contract]
pub struct QuidProbeContract;

#[contractclient(name = "QuidProbeClient")]
pub trait QuidProbe {
    fn record(
        env: Env,
        caller_contract: Address,
        hunter: Address,
        function: Symbol,
        mission_id: u64,
    ) -> Result<(), ProbeError>;

    fn has_interaction(
        env: Env,
        mission_id: u64,
        hunter: Address,
        caller_contract: Address,
        function: Symbol,
    ) -> bool;
}

#[contractimpl]
impl QuidProbeContract {
    pub fn record(
        env: Env,
        caller_contract: Address,
        hunter: Address,
        function: Symbol,
        mission_id: u64,
    ) -> Result<(), ProbeError> {
        caller_contract.require_auth();
        hunter.require_auth();

        let key = DataKey::Interaction(mission_id, hunter.clone(), caller_contract.clone());
        let ledger = env.ledger().sequence();
        let mut interaction = env
            .storage()
            .persistent()
            .get::<_, Interaction>(&key)
            .unwrap_or(Interaction {
                mission_id,
                hunter: hunter.clone(),
                caller_contract: caller_contract.clone(),
                count: 0,
                first_ledger: ledger,
                last_ledger: ledger,
                functions: Vec::new(&env),
            });

        interaction.count = interaction
            .count
            .checked_add(1)
            .ok_or(ProbeError::InteractionCountOverflow)?;
        interaction.last_ledger = ledger;
        interaction.functions.push_back(function);

        env.storage().persistent().set(&key, &interaction);
        env.storage().persistent().extend_ttl(
            &key,
            INTERACTION_TTL_LEDGERS,
            INTERACTION_TTL_LEDGERS,
        );
        Ok(())
    }

    pub fn has_interaction(
        env: Env,
        mission_id: u64,
        hunter: Address,
        caller_contract: Address,
        function: Symbol,
    ) -> bool {
        let key = DataKey::Interaction(mission_id, hunter, caller_contract);
        let Some(interaction) = env.storage().persistent().get::<_, Interaction>(&key) else {
            return false;
        };

        let mut index = 0;
        while index < interaction.functions.len() {
            if interaction.functions.get(index).as_ref() == Some(&function) {
                return true;
            }
            index += 1;
        }
        false
    }
}

#[cfg(test)]
mod test;
