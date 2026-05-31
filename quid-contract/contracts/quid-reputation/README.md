# Quid Reputation Contract

The Quid Reputation contract implements an on-chain attestation system for tracking contributor activity and reputation.

## Features

- **Issue Attestations**: Create portable attestations for contributor activity with metadata and optional expiry
- **Revoke Attestations**: Issuers can revoke attestations they've issued
- **Admin Management**: Bootstrap and manage contract admin
- **Event Logging**: Publish events when attestations are issued or revoked

## API

### `bootstrap_admin(env, admin) -> Result<(), QuidError>`

Initialize the contract admin. Can only be called once.

**Parameters:**

- `env`: Soroban environment
- `admin`: Address of the admin

**Returns:**

- `Ok(())` on success
- `Err(QuidError::NotAuthorized)` if admin is already set

---

### `get_admin(env) -> Result<Address, QuidError>`

Get the current contract admin.

**Parameters:**

- `env`: Soroban environment

**Returns:**

- `Ok(Address)` - The admin address
- `Err(QuidError::AdminNotSet)` if no admin is set

---

### `issue_attestation(env, issuer, subject, kind, label, metadata_cid, expires_at) -> Result<u64, QuidError>`

Issue an attestation for a subject.

**Parameters:**

- `env`: Soroban environment
- `issuer`: Address of the issuer (must authorize the transaction)
- `subject`: Address of the attestation subject
- `kind`: String describing the attestation type (e.g., "contributor", "expert")
- `label`: String label for the attestation (must not be empty)
- `metadata_cid`: Optional IPFS CID for additional metadata
- `expires_at`: Optional timestamp when the attestation expires

**Returns:**

- `Ok(u64)` - The attestation ID
- `Err(QuidError::NotAuthorized)` if issuer doesn't authorize
- `Err(QuidError::InvalidLabel)` if label is empty
- `Err(QuidError::InvalidExpiryTime)` if expiry is in the past

**Events:**

- Publishes `AttestationIssuedEvent` with attestation_id, issuer, and subject

---

### `get_attestation(env, attestation_id) -> Result<Attestation, QuidError>`

Retrieve an attestation by ID.

**Parameters:**

- `env`: Soroban environment
- `attestation_id`: The attestation ID

**Returns:**

- `Ok(Attestation)` - The attestation record
- `Err(QuidError::AttestationNotFound)` if attestation doesn't exist

---

### `revoke_attestation(env, attestation_id) -> Result<(), QuidError>`

Revoke an attestation (issuer only).

**Parameters:**

- `env`: Soroban environment
- `attestation_id`: The attestation ID to revoke

**Returns:**

- `Ok(())` on success
- `Err(QuidError::NotAuthorized)` if not the issuer
- `Err(QuidError::AttestationNotFound)` if attestation doesn't exist
- `Err(QuidError::AlreadyRevoked)` if already revoked

**Events:**

- Publishes `AttestationRevokedEvent` with attestation_id

## Data Structures

### Attestation

```rust
pub struct Attestation {
    pub id: u64,
    pub issuer: Address,
    pub subject: Address,
    pub kind: String,
    pub label: String,
    pub metadata_cid: Option<String>,
    pub issued_at: u64,
    pub expires_at: Option<u64>,
    pub revoked: bool,
}
```

## Testing

Run tests with:

```bash
cargo test
```

## Build

Build the contract with:

```bash
cargo build --target wasm32-unknown-unknown --release
```
