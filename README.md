# Nocturne iApp

## Command: `iapp test --args "<encrypted_amount> <sender_address> <recipient_address>"`

Quickly test decrypting an ECIES-encrypted payload for a specified recipient.  
Arguments:

- `<encrypted_data>`: The hex-encoded encrypted data (starts with `0x`).
- `<sender_address>`: Address of the data sender.
- `<recipient_address>`: Address of the intended recipient.

**Example:**

```bash
iapp test --args '"0x0468…e99e" "0x1234567890abcdef1234567890abcdef12345678" "0xfedcba0987654321fedcba0987654321fedcba09"'
```

The app will attempt to decrypt the data using the recipient's configured private key and show the result or an error.

## iExec Iapp 
- V0 : https://explorer.iex.ec/bellecour/app/0xea5955348c63795726f0acb4abbbfd1c9df75090
