<?php

/*
 * This file is part of tacraft-social-guild/flarum-login-screen.
 *
 * Copyright (c) 2026 TCS Dev HUB.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

namespace Tacraftsocialguild\Loginscreen;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),
    (new Extend\Settings())
        ->default('tacraft-social-guild-login-screen.login_buttons_per_row', '4')
        ->default('tacraft-social-guild-login-screen.login_button_size', '56')
        ->default('tacraft-social-guild-login-screen.login_button_tooltip_delay', '500')
        ->serializeToForum(
            'loginButtonsPerRow',
            'tacraft-social-guild-login-screen.login_buttons_per_row',
            fn ($value) => max(1, min(4, (int) $value))
        )
        ->serializeToForum(
            'loginButtonSize',
            'tacraft-social-guild-login-screen.login_button_size',
            fn ($value) => max(40, min(80, (int) $value))
        )
        ->serializeToForum(
            'loginButtonTooltipDelay',
            'tacraft-social-guild-login-screen.login_button_tooltip_delay',
            fn ($value) => max(0, min(2000, (int) $value))
        )
        ->registerLessConfigVar(
            'login-buttons-per-row',
            'tacraft-social-guild-login-screen.login_buttons_per_row',
            fn ($value) => max(1, min(4, (int) $value))
        )
        ->registerLessConfigVar(
            'login-button-size',
            'tacraft-social-guild-login-screen.login_button_size',
            fn ($value) => max(40, min(80, (int) $value)).'px'
        )
        ->registerLessConfigVar(
            'login-button-tooltip-delay',
            'tacraft-social-guild-login-screen.login_button_tooltip_delay',
            fn ($value) => max(0, min(2000, (int) $value)).'ms'
        ),
    new Extend\Locales(__DIR__.'/locale'),
];
