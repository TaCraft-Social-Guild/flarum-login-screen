import app from 'flarum/admin/app';
import Extend from 'flarum/common/extenders';
import commonExtend from '../common/extend';

export default [
  ...commonExtend,

  new Extend.Admin().setting(() => ({
    setting: 'tacraft-social-guild-login-screen.login_buttons_per_row',
    type: 'select',
    options: {
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
    },
    default: '4',
    label: app.translator.trans('tacraft-social-guild-login-screen.admin.settings.login_buttons_per_row_label'),
    help: app.translator.trans('tacraft-social-guild-login-screen.admin.settings.login_buttons_per_row_help'),
  })),
  new Extend.Admin().setting(() => ({
    setting: 'tacraft-social-guild-login-screen.login_button_size',
    type: 'select',
    options: {
      '40': '40 px',
      '48': '48 px',
      '56': '56 px',
      '64': '64 px',
      '72': '72 px',
      '80': '80 px',
    },
    default: '56',
    label: app.translator.trans('tacraft-social-guild-login-screen.admin.settings.login_button_size_label'),
    help: app.translator.trans('tacraft-social-guild-login-screen.admin.settings.login_button_size_help'),
  })),
  new Extend.Admin().setting(() => ({
    setting: 'tacraft-social-guild-login-screen.login_button_tooltip_delay',
    type: 'select',
    options: {
      '0': app.translator.trans('tacraft-social-guild-login-screen.admin.settings.tooltip_delay_immediate'),
      '250': '250 ms',
      '500': '500 ms',
      '750': '750 ms',
      '1000': '1 s',
      '1500': '1.5 s',
      '2000': '2 s',
    },
    default: '500',
    label: app.translator.trans('tacraft-social-guild-login-screen.admin.settings.login_button_tooltip_delay_label'),
    help: app.translator.trans('tacraft-social-guild-login-screen.admin.settings.login_button_tooltip_delay_help'),
  })),
];
