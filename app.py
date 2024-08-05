from flask import Flask, request, jsonify, render_template
import socket

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scan', methods=['POST'])
def scan():
    data = request.get_json()
    address = data['address']
    port_option = data['portOption']
    specific_port = data.get('specificPort', None)

    # Convertir el puerto específico a entero si se proporciona
    if specific_port:
        specific_port = int(specific_port)

    # Definir los puertos a escanear
    if port_option == 'common':
        ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 3389]
    elif specific_port:
        ports = [specific_port]
    else:
        ports = []

    try:
        results = scan_ports(address, ports)
        return jsonify(results)
    except socket.gaierror:
        return jsonify({'error': 'Dirección inválida'}), 400

def scan_ports(target, port_range):
    results = []
    open_ports = []

    for port in port_range:
        for family in (socket.AF_INET6, socket.AF_INET):
            sock = socket.socket(family, socket.SOCK_STREAM)
            sock.settimeout(1)
            try:
                result = sock.connect_ex((target, port))
                if result == 0:
                    open_ports.append(port)
                    results.append({"port": port, "status": "abierto"})
                else:
                    results.append({"port": port, "status": "cerrado"})
            except (socket.error, socket.gaierror):
                results.append({"port": port, "status": "filtrado"})
            finally:
                sock.close()

    return {'open_ports': open_ports, 'scan': results}

if __name__ == '__main__':
    app.run(debug=True)
