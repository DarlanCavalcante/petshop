export default function Home() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Demo Petshop</h1>
      <p className="mb-2">Essa é uma demo simples com multi-banco por empresa.</p>
      <ul className="list-disc ml-6">
        <li>
          <a className="text-blue-700 underline" href="/login">Login</a> (empresa padrão: <code>teste</code>)
        </li>
        <li>
          Após logar, veja <a className="text-blue-700 underline" href="/produtos">Produtos</a>
        </li>
      </ul>
    </div>
  );
}
