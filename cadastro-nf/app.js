new Vue({
    el: '#app',
data: function() {
        return {
            notaFiscal: '',
            resultado: '',
            isValid: false,
            ambiente: (function() {
                const val = localStorage.getItem('ambiente');
                if (val === null) return true; // Produção por padrão
                if (val === 'true' || val === true) return true;
                if (val === 'false' || val === false) return false;
                try {
                    return JSON.parse(val);
                } catch {
                    return true;
                }
            })(), // false = Testes, true = Produção
            notasValidas: (function() {
                const notas = localStorage.getItem('notasValidas');
                if (!notas) return [];
                try {
                    return JSON.parse(notas);
                } catch {
                    return [];
                }
            })(),
            notasNaoEnderecadas: [],
            primeiraNF: null,
            notasModalVisivel: false,
            // CADASTRO
            cadastroAtivo: false,
            qrCodesCadastro: [],
            paresCadastrados: [],
            // HUB CADASTRO
            inputEndereco: '',
            inputPalete: '',
            enderecoFoco: true,
            paleteFoco: false,
            inputEnderecoValido: false,
            inputPaleteValido: false,
            modalPaleteErro: false,
            // MENU CONFIGURAÇÕES
            menuConfiguracoesVisivel: false,
        };
    },
    methods: {
        finalizarCadastro() {
            // Volta para a tela inicial
            this.cadastroAtivo = false;
            this.inputEndereco = '';
            this.inputPalete = '';
            this.inputEnderecoValido = false;
            this.inputPaleteValido = false;
            this.enderecoFoco = true;
            this.paleteFoco = false;
        },
        iniciarCadastro() {
            this.resultado = '';
            this.notasNaoEnderecadas = [];
            this.primeiraNF = null;
            this.notasModalVisivel = false;
            const endpoint = this.ambiente
                ? 'https://799e50afafac.ngrok-free.app/webhook/cadastro'
                : 'https://799e50afafac.ngrok-free.app/webhook-test/cadastro';

            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acao: 'listarNotasNaoEnderecadas' })
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    this.notasNaoEnderecadas = data
                        .filter(item => item && item.NFS)
                        .map(item => ({
                            Primeira_NF: item.Primeira_NF,
                            NFS: String(item.NFS),
                            TotalPaletes: item['Total de paletes']
                        }));
                    this.primeiraNF = this.notasNaoEnderecadas.length > 0 ? this.notasNaoEnderecadas[0].Primeira_NF : null;
                    this.notasModalVisivel = true;
                } else {
                    this.resultado = 'Nenhuma nota não endereçada encontrada.';
                }
            })
            .catch((e) => {
                this.resultado = 'Erro ao buscar notas não endereçadas.';
                console.error('Erro ao buscar notas:', e);
            });
        },
        selecionarNota(nota) {
            // Envia webhook com Primeira_NF ao selecionar uma nota
            const endpoint = this.ambiente
                ? 'https://799e50afafac.ngrok-free.app/webhook/endereco'
                : 'https://799e50afafac.ngrok-free.app/webhook-test/endereco';

            const primeiraNF = String(nota.Primeira_NF || nota.primeiraNF || '');
            if (!primeiraNF) {
                this.resultado = 'Nota inválida para envio.';
                this.notasModalVisivel = false;
                return;
            }

            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primeiraNF })
            })
            .then(res => res.json())
            .then(data => {
                // Espera-se um array de objetos: [{ "QR Code P1": "14889271" }, ...]
                if (Array.isArray(data)) {
                    // Extrai apenas os valores dos QR Codes como string
                    const qrCodes = data.map(obj => String(Object.values(obj)[0]));
                    localStorage.setItem('qrCodesCadastro', JSON.stringify(qrCodes));
                    this.qrCodesCadastro = qrCodes;
                    this.paresCadastrados = [];
                    this.cadastroAtivo = true;
                }
                this.notasModalVisivel = false;
            })
            .catch((e) => {
                this.resultado = 'Erro ao enviar nota para cadastro.';
                this.notasModalVisivel = false;
                console.error('Erro ao enviar nota para cadastro:', e);
            });
        },
        // --- HUB CADASTRO ---
        setEnderecoFoco() {
            this.enderecoFoco = true;
            this.paleteFoco = false;
            this.$nextTick(() => {
                if (this.$refs.inputEndereco) this.$refs.inputEndereco.focus();
            });
        },
        setPaleteFoco() {
            this.enderecoFoco = false;
            this.paleteFoco = true;
            this.$nextTick(() => {
                if (this.$refs.inputPalete) this.$refs.inputPalete.focus();
            });
        },
        onEnderecoFocus(e) {
            this.setEnderecoFoco();
            if (e && e.target) {
                e.target.select();
            } else if (this.$refs.inputEndereco) {
                this.$refs.inputEndereco.select();
            }
        },
        onPaleteFocus(e) {
            this.setPaleteFoco();
            if (e && e.target) {
                e.target.select();
            } else if (this.$refs.inputPalete) {
                this.$refs.inputPalete.select();
            }
        },
        onEnderecoInput(e) {
            const val = typeof e === 'string' ? e : (e && e.target ? e.target.value : this.inputEndereco);
            this.inputEndereco = val.replace(/[^0-9]/g, '').slice(0,8);
            this.inputEnderecoValido = /^\d{8}$/.test(this.inputEndereco);
            if (this.inputEnderecoValido) this.setPaleteFoco();
        },
        onPaleteInput(e) {
            const val = typeof e === 'string' ? e : (e && e.target ? e.target.value : this.inputPalete);
            this.inputPalete = val.replace(/[^0-9]/g, '').slice(0,9);
            // Validação: precisa ser 7-9 dígitos E estar na lista de QR codes recebidos do endpoint /endereco
            const isFormatoValido = /^\d{7,9}$/.test(this.inputPalete);
            const lista = Array.isArray(this.qrCodesCadastro) ? this.qrCodesCadastro : [];
            if (isFormatoValido && this.inputPalete.length >= 7) {
                if (!lista.includes(this.inputPalete)) {
                    this.modalPaleteErro = true;
                    this.inputPaleteValido = false;
                    return;
                }
            }
            this.inputPaleteValido = isFormatoValido && lista.includes(this.inputPalete);
        },
        fecharModalPaleteErro() {
            this.inputPalete = '';
            this.inputPaleteValido = false;
            this.modalPaleteErro = false;
            this.setPaleteFoco();
        },
        async onSalvarCadastro() {
            if (!this.inputEnderecoValido || !this.inputPaleteValido) return;
            // Salva o par endereço-palete localmente
            const par = { endereco: this.inputEndereco, qr_code: this.inputPalete };
            this.paresCadastrados.push(par);
            localStorage.setItem('paresCadastrados', JSON.stringify(this.paresCadastrados));
            // Envia para o webhook
            const url = this.ambiente
                ? 'https://799e50afafac.ngrok-free.app/webhook/salvar'
                : 'https://799e50afafac.ngrok-free.app/webhook-test/salvar';
            try {
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(par)
                });
            } catch (e) {
                // Pode exibir erro se desejar
                console.error('Erro ao enviar cadastro:', e);
            }
            // Remove palete da lista
            this.qrCodesCadastro = this.qrCodesCadastro.filter(qr => String(qr) !== String(this.inputPalete));
            localStorage.setItem('qrCodesCadastro', JSON.stringify(this.qrCodesCadastro));
            // Limpa campos e mantém na tela de cadastro
            this.inputEndereco = '';
            this.inputPalete = '';
            this.inputEnderecoValido = false;
            this.inputPaleteValido = false;
            this.setEnderecoFoco();
        },
        excluirPaleteErro() {
            // Remove palete inválido da lista de cadastro
            this.qrCodesExpedicao = this.qrCodesExpedicao.filter(qr => String(qr) !== String(this.paleteLido));
            localStorage.setItem('qrCodesExpedicao', JSON.stringify(this.qrCodesExpedicao));
            this.modalPaleteErro = false;
            this.paleteLido = '';
        },
        fecharNotasModal() {
            this.notasModalVisivel = false;
        },
        verificarNota() {
            // Garante comparação por string
            const notasStr = this.notasValidas.map(n => String(n));
            if (notasStr.includes(String(this.notaFiscal))) {
                this.resultado = 'Nota Fiscal VÁLIDA';
                this.isValid = true;
            } else {
                this.resultado = 'Nota Fiscal NÃO ENCONTRADA';
                this.isValid = false;
            }
        },
        toggleAmbiente() {
            this.ambiente = !this.ambiente;
            localStorage.setItem('ambiente', JSON.stringify(this.ambiente));
            this.resultado = '';
            this.notasValidas = [];
            localStorage.removeItem('notasValidas');
        },
        limparCache() {
            localStorage.removeItem('notasValidas');
            this.notasValidas = [];
            this.resultado = '';
        },
        abrirMenuConfiguracoes() {
            this.menuConfiguracoesVisivel = true;
        },
        fecharMenuConfiguracoes() {
            this.menuConfiguracoesVisivel = false;
        },
        fecharNotasModal() {
            this.notasModalVisivel = false;
        }
    }
});