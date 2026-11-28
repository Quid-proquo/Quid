use crate::{ProbeError, QuidProbeClient, QuidProbeContract};
use soroban_sdk::{
    auth::{ContractContext, InvokerContractAuthEntry, SubContractInvocation},
    contract, contractimpl,
    testutils::Address as _,
    vec, Address, Env, IntoVal, Symbol,
};

#[contract]
pub struct MockDapp;

#[contractimpl]
impl MockDapp {
    pub fn interact(
        env: Env,
        probe: Address,
        hunter: Address,
        mission_id: u64,
    ) -> Result<(), ProbeError> {
        hunter.require_auth();
        let caller_contract = env.current_contract_address();
        let function = Symbol::new(&env, "swap");
        env.authorize_as_current_contract(vec![
            &env,
            InvokerContractAuthEntry::Contract(SubContractInvocation {
                context: ContractContext {
                    contract: probe.clone(),
                    fn_name: Symbol::new(&env, "record"),
                    args: (
                        caller_contract.clone(),
                        hunter.clone(),
                        function.clone(),
                        mission_id,
                    )
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

#[test]
fn dapp_records_hunter_interaction() {
    let env = Env::default();
    env.mock_all_auths();
    let probe = env.register(QuidProbeContract, ());
    let dapp = env.register(MockDapp, ());
    let hunter = Address::generate(&env);

    MockDappClient::new(&env, &dapp).interact(&probe, &hunter, &42);

    let client = QuidProbeClient::new(&env, &probe);
    assert!(client.has_interaction(&42, &hunter, &dapp, &Symbol::new(&env, "swap")));
    assert!(!client.has_interaction(&42, &hunter, &dapp, &Symbol::new(&env, "withdraw")));
}

#[test]
#[should_panic]
fn claimed_contract_cannot_be_spoofed() {
    let env = Env::default();
    let probe = env.register(QuidProbeContract, ());
    let claimed_contract = Address::generate(&env);
    let hunter = Address::generate(&env);

    QuidProbeClient::new(&env, &probe).record(
        &claimed_contract,
        &hunter,
        &Symbol::new(&env, "swap"),
        &42,
    );
}
