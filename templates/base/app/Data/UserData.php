<?php

namespace App\Data;

use Carbon\CarbonInterface;
use Spatie\LaravelData\Data;

final class UserData extends Data
{
    public function __construct(
        public readonly ?int $id,
        public readonly string $name,
        public readonly string $email,
        public readonly ?CarbonInterface $email_verified_at,
    ) {
    }
}
