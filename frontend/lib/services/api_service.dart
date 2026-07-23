import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://localhost:8443/api';

  Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/users/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> login(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/users/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> createLoan(int userId, Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/loans/$userId'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  Future<List<dynamic>> getExpenses(int loanId) async {
    final response = await http.get(Uri.parse('$baseUrl/expenses/$loanId'));
    return jsonDecode(response.body);
  }
}
