import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import { render } from 'preact';

const api = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('../src/app/api/systemModel.js', () => ({
  createSystemModelRecord: api.create,
}));

import { CreateModal } from '../src/app/views/ViewPrimitives.jsx';

const customerView = {
  model: {
    name: 'sale.customer',
    label: { es: 'Cliente', en: 'Customer' },
    schema: [
      {
        name: 'name',
        type: 'string',
        label: { es: 'Nombre' },
        form: { header: 'title', required: true },
      },
      { name: 'email', type: 'string', label: { es: 'Correo' }, form: { leftColumn: 0 } },
    ],
  },
  records: [],
};

afterEach(() => {
  render(null, document.body);
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('record creation with initial values', () => {
  it('saves initial values even when submitted immediately', async () => {
    api.create.mockResolvedValue({ uuid: 'customer-3', name: 'Nueva SA' });
    const host = document.createElement('div');
    document.body.appendChild(host);
    act(() =>
      render(
        <CreateModal
          data={customerView}
          lang="es"
          open
          initialValues={{ name: 'Nueva SA' }}
          onClose={() => {}}
        />,
        host
      )
    );

    expect(host.querySelector('input[name="name"]').value).toBe('Nueva SA');
    act(() => host.querySelector('button[aria-label="Guardar"]').click());

    await vi.waitFor(() =>
      expect(api.create).toHaveBeenCalledWith({
        model: 'sale.customer',
        values: { name: 'Nueva SA' },
      })
    );
  });
});
