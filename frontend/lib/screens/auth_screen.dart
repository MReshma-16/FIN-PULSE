import 'package:flutter/material.dart';
import 'loan_details_screen.dart';

class AuthScreen extends StatefulWidget {
  final String initialMode;
  const AuthScreen({super.key, required this.initialMode});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _isLogin = false;

  @override
  void initState() {
    super.initState();
    _isLogin = widget.initialMode == 'login';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isLogin ? 'Login' : 'Register')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              Text('WELCOME TO FIN PULSE', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              if (!_isLogin) ...[
                TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: 'Full Name'), validator: (val) => val == null || val.isEmpty ? 'Name cannot be empty' : null),
                TextFormField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email Address'), validator: (val) => val != null && val.contains('@') ? null : 'Email must be valid'),
                TextFormField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone Number'), validator: (val) => val != null && val.length == 10 ? null : 'Phone number must contain exactly 10 digits'),
                TextFormField(controller: _passwordController, decoration: const InputDecoration(labelText: 'Password'), obscureText: true, validator: (val) => val != null && val.length >= 8 ? null : 'Password must be at least 8 characters'),
                TextFormField(controller: _confirmPasswordController, decoration: const InputDecoration(labelText: 'Confirm Password'), obscureText: true, validator: (val) => val == _passwordController.text ? null : 'Confirm password must match password'),
              ] else ...[
                TextFormField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email'), validator: (val) => val != null && val.contains('@') ? null : 'Email must be valid'),
                TextFormField(controller: _passwordController, decoration: const InputDecoration(labelText: 'Password'), obscureText: true, validator: (val) => val != null && val.isNotEmpty ? null : 'Password is required'),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoanDetailsScreen()));
                  }
                },
                child: Text(_isLogin ? 'Login' : 'Register'),
              ),
              TextButton(
                onPressed: () {
                  setState(() => _isLogin = !_isLogin);
                },
                child: Text(_isLogin ? 'Create an account' : 'Already have an account? Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
