import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'preact';

import { FieldControl, FormField } from '../src/app/components/fields/index.js';

function mount(vnode) {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(vnode, host);
    return host;
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('FieldControl dispatcher', () => {
    it('falls back to a plain text input for unknown types', () => {
        const host = mount(<FieldControl field={{ name: 'x', type: 'unknown-type' }} value="hi" onChange={() => {}} />);
        expect(host.querySelector('input[type="text"]').value).toBe('hi');
    });
});

describe('StringField / TextField', () => {
    it('shows a dash when readonly and empty, and calls onChange while editing', () => {
        const host = mount(<FieldControl field={{ name: 'title', type: 'string' }} value="" readOnly onChange={() => {}} />);
        expect(host.textContent).toBe('—');

        const onChange = vi.fn();
        const editHost = mount(<FieldControl field={{ name: 'title', type: 'string' }} value="Hola" onChange={onChange} />);
        const input = editHost.querySelector('input[type="text"]');
        input.value = 'Hola mundo';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith('title', 'Hola mundo');
    });

    it('renders a textarea for text fields', () => {
        const host = mount(<FieldControl field={{ name: 'notes', type: 'text' }} value="line1" onChange={() => {}} />);
        expect(host.querySelector('textarea').value).toBe('line1');
    });
});

describe('PasswordField', () => {
    it('masks readonly values and shows a dash when empty', () => {
        const host = mount(<FieldControl field={{ name: 'api_secret', type: 'password', label: { en: 'API secret' } }} value="super-secret" readOnly onChange={() => {}} />);
        expect(host.textContent).toBe('••••••••');
        expect(host.textContent).not.toContain('super-secret');

        const emptyHost = mount(<FieldControl field={{ name: 'api_secret', type: 'password' }} value="" readOnly onChange={() => {}} />);
        expect(emptyHost.textContent).toBe('—');
    });

    it('hides editable values without a reveal button and emits changes', () => {
        const onChange = vi.fn();
        const host = mount(<FieldControl field={{ name: 'password', type: 'password' }} value="changeMe123" lang="es" onChange={onChange} />);
        const input = host.querySelector('input[name="password"]');

        expect(input.type).toBe('password');
        expect(host.querySelector('[data-password-field-toggle]')).toBeNull();

        input.value = 'new-secret';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith('password', 'new-secret');
    });

    it('does not expose encoded Argon hashes in edit mode', () => {
        const hash = '$argon2id$v=19$m=65536,t=3,p=4$abc$def';
        const onChange = vi.fn();
        const host = mount(<FieldControl field={{ name: 'password', type: 'password' }} value={hash} onChange={onChange} />);
        const input = host.querySelector('input[name="password"]');

        expect(input.value).toBe('');
        expect(input.placeholder).toBe('••••••••');
        expect(host.textContent).not.toContain('argon2');
        expect(host.querySelector('[data-password-field-toggle]')).toBeNull();
        expect(input.value).toBe('');

        input.value = 'replacement-secret';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith('password', 'replacement-secret');
    });
});

describe('numeric fields', () => {
    it('integer/decimal/monetary show em-dash when empty and format currency when readonly', () => {
        const monetaryHost = mount(
            <FieldControl field={{ name: 'total', type: 'monetary', currency: 'MXN' }} value={1234.5} readOnly onChange={() => {}} />,
        );
        expect(monetaryHost.textContent).toContain('1,234.50');

        const emptyHost = mount(<FieldControl field={{ name: 'qty', type: 'integer' }} value="" readOnly onChange={() => {}} />);
        expect(emptyHost.textContent).toBe('—');
    });

    it('percentage renders a slider in edit mode and a bar readonly', () => {
        const readHost = mount(<FieldControl field={{ name: 'progress', type: 'percentage' }} value={45} readOnly onChange={() => {}} />);
        expect(readHost.textContent).toContain('45%');

        const onChange = vi.fn();
        const editHost = mount(<FieldControl field={{ name: 'progress', type: 'percentage' }} value={45} onChange={onChange} />);
        const slider = editHost.querySelector('input[type="range"]');
        slider.value = '80';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith('progress', 80);
    });
});

describe('boolean field', () => {
    it('is disabled when readonly and toggles onChange otherwise', () => {
        const readHost = mount(<FieldControl field={{ name: 'active', type: 'boolean' }} value readOnly onChange={() => {}} />);
        expect(readHost.querySelector('input').disabled).toBe(true);

        const onChange = vi.fn();
        const editHost = mount(<FieldControl field={{ name: 'active', type: 'boolean' }} value={false} onChange={onChange} />);
        const checkbox = editHost.querySelector('input');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith('active', true);
    });
});

describe('date / datetime fields', () => {
    it('formats readonly values and emits raw input values while editing', () => {
        const onChange = vi.fn();
        const host = mount(<FieldControl field={{ name: 'due', type: 'date' }} value="" onChange={onChange} />);
        const input = host.querySelector('input[type="date"]');
        input.value = '2026-07-02';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith('due', '2026-07-02');
    });
});

describe('image field', () => {
    it('shows a placeholder when empty and an image when a value is set', () => {
        const placeholderHost = mount(<FieldControl field={{ name: 'photo', type: 'image', label: { en: 'Photo' } }} value="" readOnly onChange={() => {}} />);
        expect(placeholderHost.querySelector('.form-image-placeholder')).not.toBeNull();

        const imageHost = mount(<FieldControl field={{ name: 'photo', type: 'image' }} value="data:image/png;base64,AAAA" readOnly onChange={() => {}} />);
        expect(imageHost.querySelector('img').src).toContain('data:image/png');
    });

    it('lets an editable image be cleared', () => {
        const onChange = vi.fn();
        const host = mount(<FieldControl field={{ name: 'photo', type: 'image' }} value="data:image/png;base64,AAAA" onChange={onChange} />);
        host.querySelector('button[aria-label="Remove image"]').click();
        expect(onChange).toHaveBeenCalledWith('photo', '');
    });

    it('renders a compact circular avatar in list context', () => {
        const host = mount(
            <FieldControl field={{ name: 'photo', type: 'image', label: { en: 'Photo' } }}
                value="/avatar.jpg" readOnly context={{ view: 'list' }} onChange={() => {}} />,
        );
        const image = host.querySelector('img');
        expect(image.classList.contains('h-7')).toBe(true);
        expect(image.classList.contains('w-7')).toBe(true);
        expect(image.classList.contains('rounded-full')).toBe(true);
    });
});

describe('many2one / many2one_avatar fields', () => {
    it('links to the record when readonly, and edits the display name as free text', () => {
        const value = { uuid: 'c1', name: 'Acme', model: 'partner' };
        const readHost = mount(<FieldControl field={{ name: 'partner', type: 'many2one' }} value={value} readOnly onChange={() => {}} />);
        const link = readHost.querySelector('a');
        expect(link.textContent).toBe('Acme');
        expect(link.getAttribute('href')).toContain('partner');

        const onChange = vi.fn();
        const editHost = mount(<FieldControl field={{ name: 'partner', type: 'many2one' }} value={value} onChange={onChange} />);
        const input = editHost.querySelector('input[type="text"]');
        input.value = 'Acme Corp';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith('partner', { ...value, name: 'Acme Corp' });
    });

    it('renders an avatar alongside the name when readonly', () => {
        const value = { uuid: 'u1', name: 'Dana', model: 'user', avatar: '/images/avatar/1.jpg' };
        const host = mount(<FieldControl field={{ name: 'owner', type: 'many2one_avatar' }} value={value} readOnly onChange={() => {}} />);
        expect(host.querySelector('img').getAttribute('src')).toBe('/images/avatar/1.jpg');
        expect(host.textContent).toContain('Dana');
    });
});

describe('one2many / many2many fields', () => {
    const items = [{ uuid: '1', name: 'Line A' }, { uuid: '2', name: 'Line B' }];

    it('shows a dash when empty and a list of links when readonly', () => {
        const emptyHost = mount(<FieldControl field={{ name: 'lines', type: 'one2many' }} value={[]} readOnly onChange={() => {}} />);
        expect(emptyHost.textContent).toBe('—');

        const host = mount(<FieldControl field={{ name: 'lines', type: 'one2many' }} value={items} readOnly onChange={() => {}} />);
        expect(host.querySelectorAll('li').length).toBe(2);
    });

    it('one2many only allows removing existing items, not adding new ones', () => {
        const onChange = vi.fn();
        const host = mount(<FieldControl field={{ name: 'lines', type: 'one2many' }} value={items} onChange={onChange} />);
        expect(host.querySelector('input[type="text"]')).toBeNull();
        host.querySelector('.form-tag-chip-remove').click();
        expect(onChange).toHaveBeenCalledWith('lines', [items[1]]);
    });

    it('many2many allows adding a plain-name entry', () => {
        const onChange = vi.fn();
        const host = mount(<FieldControl field={{ name: 'tags', type: 'many2many' }} value={[]} onChange={onChange} />);
        const input = host.querySelector('input[type="text"]');
        input.value = 'New link';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        expect(onChange).toHaveBeenCalledWith('tags', [{ name: 'New link' }]);
    });
});

describe('one2many_kanban view', () => {
    const field = {
        name: 'users', type: 'one2many_pills',
        form: { view: 'one2many_kanban', kanban_view: { header: { image: 'avatar_url', title: 'name', subtitle: 'email' } } },
    };
    const users = [
        { uuid: 'u1', model: 'user.user', name: 'Ana', email: 'ana@example.com', avatar_url: '', color: 'blue' },
        { uuid: 'u2', model: 'user.user', name: 'Beto', email: 'beto@example.com', avatar_url: 'https://example.com/beto.png' },
    ];

    it('overrides the type-based renderer in the form body and shows a dash when empty', () => {
        const host = mount(<FormField field={field} value={[]} readOnly onChange={() => {}} hideLabel />);
        expect(host.textContent).toBe('—');
    });

    it('renders a card per record with title, subtitle, and an icon avatar fallback', () => {
        const host = mount(<FormField field={field} value={users} readOnly onChange={() => {}} hideLabel />);
        const cards = host.querySelectorAll('article');
        expect(cards.length).toBe(2);
        expect(cards[0].textContent).toContain('Ana');
        expect(cards[0].textContent).toContain('ana@example.com');
        expect(cards[0].querySelector('img')).toBeNull();
        expect(cards[0].querySelector('svg')).not.toBeNull();
        expect(cards[1].querySelector('img').src).toBe('https://example.com/beto.png');
    });

    it('colors the card border from the record color and links to the record', () => {
        const host = mount(<FormField field={field} value={users} readOnly onChange={() => {}} hideLabel />);
        const [card] = host.querySelectorAll('article');
        expect(card.style.borderColor).toBe('#2563eb');
        expect(card.querySelector('a').getAttribute('href')).toContain('u1');
    });

    it('removes a record when editable', () => {
        const onChange = vi.fn();
        const host = mount(<FormField field={field} value={users} onChange={onChange} hideLabel />);
        host.querySelector('article button').click();
        expect(onChange).toHaveBeenCalledWith('users', [users[1]]);
    });

    it('does not apply to List/Kanban cells rendered via FieldControl directly', () => {
        const host = mount(<FieldControl field={field} value={users} readOnly onChange={() => {}} />);
        expect(host.querySelectorAll('article').length).toBe(0);
    });
});

describe('many2many_pills field', () => {
    const tags = [
        { uuid: 't1', name: { en: 'Urgent', es: 'Urgente' }, color: 'red' },
        { uuid: 't2', name: { en: 'VIP', es: 'VIP' }, color: 'purple' },
    ];

    it('renders selected pills when readonly', () => {
        const host = mount(
            <FieldControl field={{ name: 'tags', type: 'many2many_pills' }} value={['t1']} readOnly
                context={{ tags }} onChange={() => {}} />,
        );
        expect(host.textContent).toContain('Urgent');
        expect(host.textContent).not.toContain('VIP');
    });

    it('opens the picker, selects a tag on click, and removes it via its chip', async () => {
        const onChange = vi.fn();
        const host = mount(
            <FieldControl field={{ name: 'tags', type: 'many2many_pills' }} value={[]} context={{ tags }} onChange={onChange} />,
        );
        host.querySelector('.form-tag-picker-control').click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        const options = host.querySelectorAll('.form-tag-picker-option');
        expect(options.length).toBe(2);
        options[0].click();
        expect(onChange).toHaveBeenCalledWith('tags', ['t1']);
    });

    it('filters options as the user types', async () => {
        const host = mount(
            <FieldControl field={{ name: 'tags', type: 'many2many_pills' }} value={[]} context={{ tags }} onChange={() => {}} />,
        );
        const search = host.querySelector('.form-tag-picker-search');
        search.value = 'vip';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));
        const options = host.querySelectorAll('.form-tag-picker-option');
        expect(options.length).toBe(1);
        expect(options[0].textContent).toContain('VIP');
    });
});

describe('html field', () => {
    it('renders sanitized rich text when readonly and a Quill editor when editable', async () => {
        const readHost = mount(
            <FieldControl field={{ name: 'body', type: 'html' }} value="<p>Hola</p><script>window.x=1</script>" readOnly onChange={() => {}} />,
        );
        expect(readHost.textContent).toContain('Hola');
        expect(readHost.querySelector('script')).toBeNull();

        const editHost = mount(<FieldControl field={{ name: 'body', type: 'html' }} value="<p>Hola</p>" onChange={() => {}} />);
        await vi.waitFor(() => expect(editHost.querySelector('.ql-editor')).not.toBeNull());
    });
});

describe('FormField wrapper', () => {
    it('renders the label, required mark and help, and routes booleans through the inline layout', () => {
        const host = mount(
            <FormField field={{ name: 'active', type: 'boolean', label: { en: 'Active' }, form: { required: true, help: { en: 'Toggle it' } } }}
                value onChange={() => {}} />,
        );
        expect(host.querySelector('.form-boolean-label').textContent).toContain('Active');
        expect(host.querySelector('.form-required-mark')).not.toBeNull();
        expect(host.querySelector('[data-form-help]')).not.toBeNull();
    });

    it('only keeps one help popover open at a time', async () => {
        const host = mount(
            <div>
                <FormField field={{ name: 'a', type: 'string', label: { en: 'A' }, form: { help: { en: 'Help A' } } }} value="" onChange={() => {}} />
                <FormField field={{ name: 'b', type: 'string', label: { en: 'B' }, form: { help: { en: 'Help B' } } }} value="" onChange={() => {}} />
            </div>,
        );
        const triggers = host.querySelectorAll('.form-help-trigger');
        triggers[0].click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(host.querySelectorAll('.form-help-popover')[0].hidden).toBe(false);
        triggers[1].click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(host.querySelectorAll('.form-help-popover')[0].hidden).toBe(true);
        expect(host.querySelectorAll('.form-help-popover')[1].hidden).toBe(false);
    });
});
