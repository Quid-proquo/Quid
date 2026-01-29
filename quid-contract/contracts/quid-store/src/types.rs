use soroban_sdk::{Address, String, contracttype};

#[derive(Clone, Debug, Default, PartialEq, Eq, Copy)]
#[contracttype]
pub enum MissionStatus {
    #[default]
    Created,
    Started,
    Paused,
    Completed,
    Cancelled
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Mission {
    pub id: u64,
    pub owner: Address,
    pub title: String,
    pub description_cid: String,
    pub reward_token: Address,
    pub reward_amount: i128,
    pub max_participants: u32,
    pub participants_count: u32,
    pub status: MissionStatus,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Mission(u64),
    MissionCount
}