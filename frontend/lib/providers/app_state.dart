import 'package:flutter/material.dart';

class AppState extends ChangeNotifier {
  bool isDarkMode = false;
  Map<String, dynamic>? currentUser;
  Map<String, dynamic>? activeLoan;

  void toggleTheme() {
    isDarkMode = !isDarkMode;
    notifyListeners();
  }

  void setUser(Map<String, dynamic> user) {
    currentUser = user;
    notifyListeners();
  }

  void setActiveLoan(Map<String, dynamic> loan) {
    activeLoan = loan;
    notifyListeners();
  }
}
