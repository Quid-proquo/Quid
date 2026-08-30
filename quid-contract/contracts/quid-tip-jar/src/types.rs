use soroban_sdk::contracttype;

/// Storage key enum — tip-jar is stateless (pass-through), so this exists only
/// to satisfy the standard crate layout and allow future extension (e.g. a
/// per-mission tip counter).
#[contracttype]
pub enum DataKey {
    /// Total tips sent for a given mission. Stored as i128.
    MissionTipTotal(u64),
}
