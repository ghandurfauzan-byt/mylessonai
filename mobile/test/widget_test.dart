import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ExplainMyLessonMobileApp());
    expect(find.byType(ExplainMyLessonMobileApp), findsOneWidget);
  });
}
