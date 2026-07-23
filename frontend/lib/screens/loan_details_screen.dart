import 'package:flutter/material.dart';
import 'dashboard_screen.dart';

class LoanDetailsScreen extends StatefulWidget {
  const LoanDetailsScreen({super.key});

  @override
  State<LoanDetailsScreen> createState() => _LoanDetailsScreenState();
}

class _LoanDetailsScreenState extends State<LoanDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  String _loanType = 'Personal Loan';
  final TextEditingController _amountController = TextEditingController(text: '500000');
  final TextEditingController _rateController = TextEditingController(text: '12');
  final TextEditingController _tenureController = TextEditingController(text: '5');
  final TextEditingController _purposeController = TextEditingController();
  final TextEditingController _incomeController = TextEditingController(text: '80000');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Loan Details')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              DropdownButtonFormField<String>(
                value: _loanType,
                items: const [
                  DropdownMenuItem(value: 'Personal Loan', child: Text('Personal Loan')),
                  DropdownMenuItem(value: 'Education Loan', child: Text('Education Loan')),
                  DropdownMenuItem(value: 'Home Loan', child: Text('Home Loan')),
                  DropdownMenuItem(value: 'Vehicle Loan', child: Text('Vehicle Loan')),
                  DropdownMenuItem(value: 'Business Loan', child: Text('Business Loan')),
                  DropdownMenuItem(value: 'Agriculture Loan', child: Text('Agriculture Loan')),
                ],
                onChanged: (value) => setState(() => _loanType = value ?? _loanType),
                decoration: const InputDecoration(labelText: 'Loan Type'),
              ),
              TextFormField(controller: _amountController, decoration: const InputDecoration(labelText: 'Loan Amount'), keyboardType: TextInputType.number),
              TextFormField(controller: _rateController, decoration: const InputDecoration(labelText: 'Interest Rate (%)'), keyboardType: TextInputType.number),
              TextFormField(controller: _tenureController, decoration: const InputDecoration(labelText: 'Loan Tenure (Years)'), keyboardType: TextInputType.number),
              TextFormField(controller: _purposeController, decoration: const InputDecoration(labelText: 'Purpose of Loan')),
              TextFormField(controller: _incomeController, decoration: const InputDecoration(labelText: 'Monthly Income'), keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Text('Estimated EMI', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text('₹ ${((double.tryParse(_amountController.text) ?? 0) / 12).toStringAsFixed(0)}', style: Theme.of(context).textTheme.titleLarge),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
                    },
                    child: const Text('Approve & Save'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: OutlinedButton(onPressed: () {}, child: const Text('Cancel'))),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
