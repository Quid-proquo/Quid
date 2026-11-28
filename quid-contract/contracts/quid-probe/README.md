# quid-probe

`quid-probe` records hunter interactions reported by a dApp contract. Each
record requires authorization from both the reporting contract and the hunter.
The persistent `Interaction(mission_id, hunter, caller_contract)` record stores
the call count, first and last ledger sequence, and recorded function symbols.
Each record's TTL is extended on every write.

## Integrate from a dApp

Add a client for the probe contract and call it from the dApp entrypoint. The
current contract address is the caller identity; do not accept it as an
unvalidated external parameter.

```rust
use quid_probe::ProbeError;
use soroban_sdk::{
    auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation},
    contract, contractclient, contractimpl, vec, Address, Env, IntoVal, Symbol,
};

#[contractclient(name = "QuidProbeClient")]
pub trait QuidProbe {
    fn record(
        env: Env,
        caller_contract: Address,
        hunter: Address,
        function: Symbol,
        mission_id: u64,
    ) -> Result<(), ProbeError>;
}

#[contract]
pub struct MyDapp;

#[contractimpl]
impl MyDapp {
    pub fn tracked_entrypoint(
        env: Env,
        probe: Address,
        hunter: Address,
        mission_id: u64,
    ) -> Result<(), ProbeError> {
        hunter.require_auth();
        let caller_contract = env.current_contract_address();
        let function = Symbol::new(&env, "tracked_entrypoint");
        env.authorize_as_current_contract(vec![
            &env,
            InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: probe.clone(),
                    fn_name: Symbol::new(&env, "record"),
                    args: (caller_contract.clone(), hunter.clone(), function.clone(), mission_id)
                        .into_val(&env),
                },
                sub_invocations: vec![&env],
            }),
        ]);
        QuidProbeClient::new(&env, &probe).record(
            &caller_contract,
            &hunter,
            &function,
            &mission_id,
        );
        Ok(())
    }
}
```

The dApp caller must be authorized for the nested probe call, and the hunter
must authorize the interaction. The `has_interaction` query checks whether a
specific function was recorded for a mission, hunter, and dApp contract.
