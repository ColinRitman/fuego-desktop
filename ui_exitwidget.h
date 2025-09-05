/********************************************************************************
** Form generated from reading UI file 'exitwidget.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_EXITWIDGET_H
#define UI_EXITWIDGET_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_ExitWidget
{
public:
    QHBoxLayout *horizontalLayout;
    QLabel *m_clockLabel;
    QLabel *m_label;

    void setupUi(QWidget *ExitWidget)
    {
        if (ExitWidget->objectName().isEmpty())
            ExitWidget->setObjectName(QString::fromUtf8("ExitWidget"));
        ExitWidget->resize(385, 66);
        ExitWidget->setStyleSheet(QString::fromUtf8("background-color: #282d31;\n"
"color: #ddd;\n"
"border: 0px;"));
        horizontalLayout = new QHBoxLayout(ExitWidget);
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        m_clockLabel = new QLabel(ExitWidget);
        m_clockLabel->setObjectName(QString::fromUtf8("m_clockLabel"));

        horizontalLayout->addWidget(m_clockLabel);

        m_label = new QLabel(ExitWidget);
        m_label->setObjectName(QString::fromUtf8("m_label"));
        QFont font;
        font.setFamily(QString::fromUtf8("orbitron"));
        m_label->setFont(font);
        m_label->setStyleSheet(QString::fromUtf8("font-size: 15px;\n"
"font-family:orbitron;"));

        horizontalLayout->addWidget(m_label);

        horizontalLayout->setStretch(1, 1);

        retranslateUi(ExitWidget);

        QMetaObject::connectSlotsByName(ExitWidget);
    } // setupUi

    void retranslateUi(QWidget *ExitWidget)
    {
        ExitWidget->setWindowTitle(QCoreApplication::translate("ExitWidget", "Saving data", nullptr));
        m_clockLabel->setText(QString());
        m_label->setText(QCoreApplication::translate("ExitWidget", "%1 wallet is saving data.\n"
"Please wait...", nullptr));
    } // retranslateUi

};

namespace Ui {
    class ExitWidget: public Ui_ExitWidget {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_EXITWIDGET_H
