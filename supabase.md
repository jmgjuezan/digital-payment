## Table `payments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `created_at` | `timestamptz` |  |
| `type` | `varchar` |  |
| `tran_id` | `varchar` |  Nullable |
| `time` | `time` |  |
| `charge` | `float8` |  |
| `amount` | `float8` |  |
| `device` | `varchar` |  |
| `note` | `varchar` |  Nullable |
| `date` | `date` |  |
| `created_by` | `uuid` |  |

## Table `user_roles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `user_id` | `uuid` |  |
| `role` | `app_role` |  |

## Table `balances`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary Identity |
| `created_at` | `timestamptz` |  |
| `type` | `varchar` |  |
| `device` | `varchar` |  |
| `date` | `date` |  |
| `amount` | `float8` |  |
