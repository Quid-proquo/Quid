# Quid Reputation Contract

A Soroban smart contract for managing attestations on the Stellar blockchain.

## Overview

The Quid Reputation Contract allows issuers to create attestations for subjects, which can be used to build reputation systems. Attestations can be revoked by either the original issuer or the contract admin.

## Features

- **Initialize**: Set up the contract with an admin address
- **Issue Attestation**: Create new attestations for subjects
- **Revoke Attestation**: Revoke attestations (issuer or admin only)
- **Query Attestations**: Retrieve attestation details and check existence

## Contract Structure

```
quid-reputation/
├── Cargo.toml          # Package configuration
├── Makefile            # Build and test commands
├── README.md           # This file
└── src/
    ├── lib.rs          # Main contract implementation
    ├── types.rs        # Data structures and storage keys
    ├── error.rs        # Error definitions
    └── test.rs         # Unit tests
```

## Data Types

### Attestation
```rust
pub struct Attestation {
    pub id: u64,
    pub issuer: Address,
    pub subject: Address,
    pub attestation_type: String,
    pub data_cid: String,
    pub issued_at: u64,
    pub revoked: bool,
}
```

### Errors
- `NotAuthorized` (1): Caller is not authorized to perform the action
- `AttestationNotFound` (2): Attestation does not exist
- `AlreadyRevoked` (3): Attestation has already been revoked
- `InvalidInput` (4): Invalid input parameters

## Building

```bash
make build
```

Or using cargo directly:
```bash
cargo build -p quid-reputation
```

## Testing

```bash
make test
```

Or using cargo directly:
```bash
cargo test -p quid-reputation
```

## Usage

### Initialize the Contract
```rust
client.initialize(&admin_address);
```

### Issue an Attestation
```rust
let attestation_id = client.issue_attestation(
    &issuer,
    &subject,
    &attestation_type,
    &data_cid
);
```

### Revoke an Attestation
```rust
// By issuer
client.revoke_attestation(&issuer, &attestation_id);

// Or by admin
client.revoke_attestation(&admin, &attestation_id);
```

### Get an Attestation
```rust
let attestation = client.get_attestation(&attestation_id);
```

## Authorization

- **Initialize**: Requires authorization from the admin address
- **Issue Attestation**: Requires authorization from the issuer
- **Revoke Attestation**: Requires authorization from either the original issuer or the contract admin
- **Query Operations**: No authorization required

## Storage

The contract uses:
- **Instance Storage**: For admin address and attestation count
- **Persistent Storage**: For attestation data with TTL of 5,184,000 ledgers (~60 days)

## License

See the main project LICENSE file.
